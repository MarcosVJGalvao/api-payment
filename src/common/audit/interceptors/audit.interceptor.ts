import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError, from } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { Request } from 'express';
import { AuditService } from '../services/audit.service';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { IAuditLogData } from '../interfaces/audit-log.interface';
import { SanitizeDataHelper } from '../helpers/sanitize-data.helper';
import { AuditLogStatus } from '../enums/audit-log-status.enum';
import { AuditAction } from '../enums/audit-action.enum';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import {
  mapHttpStatusToErrorCode,
  processUnhandledError,
} from '@/common/errors/helpers/error.helpers';
import { extractMessage } from '@/common/errors/helpers/message.helpers';
import { RequestWithAccount } from '@/financial-providers/guards/account.guard';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  private readonly entityTableMap: Record<string, string> = {
    // Add mappings here as you create modules
    // User: 'user',
  };

  private readonly entityClassMap: Record<string, any> = {
    // Add entity classes here as you create modules
    // User: User,
  };

  private readonly entityRelationsMap: Record<string, string[]> = {
    // Add entity relations here as you create modules
    // User: ['profile'],
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const auditOptions = this.reflector.get<AuditOptions>(AUDIT_KEY, handler);

    if (!auditOptions) {
      return next.handle();
    }

    const user = request.user as JwtPayload | undefined;
    let userId = user?.userId;
    let username = user?.username;

    // Se não encontrou userId no request.user, tenta extrair do providerSession (para autenticação de provider)
    if (!userId && 'providerSession' in request && request.providerSession) {
      const providerSession = request.providerSession;
      if ('userId' in providerSession && providerSession.userId) {
        userId = String(providerSession.userId);
      } else if ('accountId' in providerSession && providerSession.accountId) {
        // Se não tiver userId, usa accountId como identificador alternativo
        userId = String(providerSession.accountId);
      }
    }

    // Tenta extrair do token JWT (para tokens de usuários internos)
    if (!userId) {
      const tokenUserId = this.extractUserIdFromToken(request);
      if (tokenUserId) {
        userId = tokenUserId;
        if (!username) {
          const tokenUsername = this.extractUsernameFromToken(request);
          if (tokenUsername) {
            username = tokenUsername;
          }
        }
      }
    }

    if (!username && request.body && request.body.username) {
      username = request.body.username;
    }

    const isPublicEndpoint =
      auditOptions.action === AuditAction.USER_LOGIN ||
      auditOptions.action === AuditAction.USER_LOGIN_FAILED;

    if (!userId && !isPublicEndpoint) {
      this.logger.warn(
        `UserId not available for audit log: ${auditOptions.action} on ${request.method} ${request.url}. UserId should be available for authenticated endpoints.`,
      );
    }

    const correlationId = request['correlationId'] as string | undefined;
    const ipAddress = this.auditService.extractIpAddress(
      request as unknown as Request,
    );
    const userAgent = this.auditService.extractUserAgent(
      request as unknown as Request,
    );

    const entityIdParam = auditOptions.entityIdParam || 'id';
    const entityId = this.extractEntityId(request, entityIdParam);

    const fetchOldValuesPromise =
      auditOptions.captureOldValues && entityId
        ? this.fetchEntityBeforeUpdate(
            auditOptions.entityType,
            entityId,
            auditOptions.ignoreFields,
          )
        : Promise.resolve(undefined);

    let newValues: Record<string, unknown> | undefined;
    if (auditOptions.captureNewValues) {
      const body = request.body;
      if (body) {
        let sanitizedBody = SanitizeDataHelper.sanitize(body) as Record<
          string,
          unknown
        >;

        if (auditOptions.ignoreFields && auditOptions.ignoreFields.length > 0) {
          sanitizedBody = SanitizeDataHelper.removeFields(
            sanitizedBody,
            auditOptions.ignoreFields,
          ) as Record<string, unknown>;
        }

        newValues =
          Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined;
      }
    }

    const auditLogData: IAuditLogData = {
      action: auditOptions.action,
      entityType: auditOptions.entityType,
      entityId,
      userId: userId || undefined,
      username: username || undefined,
      correlationId,
      oldValues: undefined,
      newValues,
      ipAddress,
      userAgent,
      description: auditOptions.description,
      status: AuditLogStatus.SUCCESS,
    };

    return from(fetchOldValuesPromise).pipe(
      switchMap((oldValues) => {
        auditLogData.oldValues = oldValues;

        return next.handle().pipe(
          tap((response) => {
            if (auditOptions.action === AuditAction.USER_LOGIN && response) {
              try {
                const accessToken = response?.accessToken;
                if (accessToken) {
                  try {
                    const decoded = this.jwtService.decode(String(accessToken));
                    if (
                      decoded &&
                      typeof decoded === 'object' &&
                      'userId' in decoded &&
                      decoded.userId
                    ) {
                      const payload = decoded as JwtPayload;
                      if (!auditLogData.userId) {
                        auditLogData.userId = payload.userId;
                      }

                      if (!auditLogData.entityId) {
                        auditLogData.entityId = payload.userId;
                      }

                      if (!auditLogData.username && payload.username) {
                        auditLogData.username = payload.username;
                      }
                    }
                  } catch (error) {
                    this.logger.warn(
                      `Failed to decode accessToken for login audit: ${error.message}`,
                    );
                  }
                }
              } catch (error) {
                this.logger.warn(
                  `Failed to extract userId from login response: ${error.message}`,
                );
              }
            }

            this.processAuditLogSync(
              response,
              auditLogData,
              auditOptions,
              request,
            );
          }),
          catchError((error) => {
            auditLogData.status = AuditLogStatus.FAILURE;

            if (error instanceof CustomHttpException) {
              const message = error.customMessage;
              auditLogData.errorMessage = Array.isArray(message)
                ? message.join('; ')
                : String(message);

              auditLogData.errorCode = String(error.errorCode);
            } else if (error instanceof HttpException) {
              const exceptionResponse = error.getResponse();
              const extractedMessage = extractMessage(exceptionResponse);
              auditLogData.errorMessage = Array.isArray(extractedMessage)
                ? extractedMessage.join('; ')
                : String(extractedMessage);

              if (
                exceptionResponse &&
                typeof exceptionResponse === 'object' &&
                exceptionResponse !== null
              ) {
                if ('errorCode' in exceptionResponse) {
                  auditLogData.errorCode = String(
                    (exceptionResponse as any).errorCode,
                  );
                } else if ('erroCode' in exceptionResponse) {
                  auditLogData.errorCode = String(
                    (exceptionResponse as any).erroCode,
                  );
                }
              }

              if (!auditLogData.errorCode) {
                const status = error.getStatus();
                const mappedErrorCode = mapHttpStatusToErrorCode(status);
                auditLogData.errorCode = String(mappedErrorCode);
              }
            } else {
              const errorResult = processUnhandledError(error as Error);
              auditLogData.errorMessage = String(errorResult.message);
              auditLogData.errorCode = String(errorResult.errorCode);
            }

            if (
              !auditLogData.errorMessage ||
              auditLogData.errorMessage.trim() === ''
            ) {
              auditLogData.errorMessage =
                error?.message || 'Unknown error occurred';
              this.logger.warn(
                `Error message was empty, using fallback: ${auditLogData.errorMessage}`,
              );
            }

            if (
              auditLogData.errorCode &&
              auditLogData.errorCode.trim() === ''
            ) {
              auditLogData.errorCode = undefined;
              this.logger.warn(
                'Error code was empty string, setting to undefined',
              );
            }

            if (
              auditOptions.action === AuditAction.USER_LOGIN &&
              auditLogData.status === AuditLogStatus.FAILURE
            ) {
              auditLogData.action = AuditAction.USER_LOGIN_FAILED;
            }

            if (!this.validateAuditLogData(auditLogData)) {
              this.logger.error(
                `Validation failed for audit log data in error handler. Skipping persistence. Action: ${auditLogData.action}, EntityType: ${auditLogData.entityType}, Status: ${auditLogData.status}`,
              );
            } else {
              this.auditService.log(auditLogData).catch((logError) => {
                this.logger.error(
                  `Failed to create audit log in error handler: action=${auditLogData.action}, entityType=${auditLogData.entityType}, error=${logError.message}, stack=${logError.stack?.substring(0, 500)}`,
                  logError.stack,
                );
              });
            }

            return throwError(() => error);
          }),
        );
      }),
    );
  }

  private extractEntityId(request: any, paramName: string): string | undefined {
    try {
      if (request.params && request.params[paramName]) {
        const entityId = String(request.params[paramName]);
        return entityId;
      }

      if (request.body && request.body[paramName]) {
        const entityId = String(request.body[paramName]);
        return entityId;
      }

      if (request.query && request.query[paramName]) {
        const entityId = String(request.query[paramName]);
        return entityId;
      }

      if (paramName === 'id' && request.body && request.body.id) {
        const entityId = String(request.body.id);
        return entityId;
      }

      return undefined;
    } catch (error) {
      this.logger.warn(
        `Failed to extract entityId with paramName ${paramName}: ${error.message}`,
        error.stack,
      );
      return undefined;
    }
  }

  /**
   * Extracts entityId from response after creation
   * @param response - The response object from the handler
   * @returns The entityId if found in the response, undefined otherwise
   */
  private extractEntityIdFromResponse(response: any): string | undefined {
    try {
      if (!response) {
        return undefined;
      }

      if (response.id) {
        const entityId = String(response.id);
        return entityId;
      }

      if (response.data && response.data.id) {
        const entityId = String(response.data.id);
        return entityId;
      }

      if (response.result && response.result.id) {
        const entityId = String(response.result.id);
        return entityId;
      }

      return undefined;
    } catch (error) {
      this.logger.warn(
        `Failed to extract entityId from response: ${error.message}`,
        error.stack,
      );
      return undefined;
    }
  }

  private extractUserIdFromToken(request: any): string | undefined {
    try {
      const authHeader = request.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return undefined;
      }

      const token = authHeader.substring(7);

      try {
        const decoded = this.jwtService.decode(String(token));
        if (decoded && decoded.userId) {
          return decoded.userId;
        }
      } catch {
        return undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private extractUsernameFromToken(request: any): string | undefined {
    try {
      const authHeader = request.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return undefined;
      }

      const token = authHeader.substring(7);

      try {
        const decoded = this.jwtService.decode(String(token));
        if (decoded && decoded.username) {
          return decoded.username;
        }
      } catch {
        return undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Busca a entidade do banco de dados antes da atualização para capturar valores antigos
   * @param entityType - Tipo da entidade (ex: 'User', 'Employee')
   * @param entityId - ID da entidade
   * @param ignoreFields - Campos a ignorar na sanitização
   * @returns Valores antigos sanitizados ou undefined se não encontrado
   */
  private async fetchEntityBeforeUpdate(
    entityType: string,
    entityId: string,
    ignoreFields?: string[],
  ): Promise<Record<string, unknown> | undefined> {
    try {
      if (!entityId || entityId.trim() === '') {
        return undefined;
      }

      const EntityClass = this.entityClassMap[entityType];

      if (!EntityClass) {
        this.logger.warn(
          `Unknown entity type: ${entityType}. Cannot fetch old values. Add mapping in entityClassMap. Available types: ${Object.keys(this.entityClassMap).join(', ')}`,
        );
        return undefined;
      }

      const repository = this.dataSource.getRepository(
        EntityClass as EntityTarget<ObjectLiteral>,
      );

      const relations = this.entityRelationsMap[entityType] || [];

      const entity = await repository.findOne({
        where: { id: entityId } as any,
        relations: relations.length > 0 ? relations : undefined,
      });

      if (!entity) {
        return undefined;
      }

      const entityObject = this.transformEntityToObject(entity);

      let sanitizedOldValues = SanitizeDataHelper.sanitize(
        entityObject,
      ) as Record<string, unknown>;

      if (ignoreFields && ignoreFields.length > 0) {
        sanitizedOldValues = SanitizeDataHelper.removeFields(
          sanitizedOldValues,
          ignoreFields,
        ) as Record<string, unknown>;
      }

      const internalFields = [
        'id',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'created_at',
        'updated_at',
        'deleted_at',
      ];
      this.removeInternalFields(sanitizedOldValues, internalFields);

      const fieldsCount = this.countFields(sanitizedOldValues);
      if (fieldsCount > 0) {
        return sanitizedOldValues;
      } else {
        return undefined;
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch old values for ${entityType} with id ${entityId}: ${error.message}`,
        error.stack,
      );
      return undefined;
    }
  }

  /**
   * Transforma uma entidade TypeORM em objeto plano, incluindo relações
   * @param entity - Entidade TypeORM
   * @returns Objeto plano com os dados da entidade
   */
  private transformEntityToObject(entity: any): any {
    if (!entity) return null;

    if (entity instanceof Date) {
      return entity.toISOString();
    }

    if (Array.isArray(entity)) {
      return entity.map((item) => this.transformEntityToObject(item));
    }

    if (typeof entity !== 'object') {
      return entity;
    }

    const result: any = {};

    for (const key in entity) {
      if (key in entity) {
        const value = entity[key];

        if (value === null || value === undefined) {
          result[key] = value;
        } else if (value instanceof Date) {
          result[key] = value.toISOString();
        } else if (Array.isArray(value)) {
          result[key] = value.map((item) => this.transformEntityToObject(item));
        } else if (typeof value === 'object') {
          if ('id' in value || 'constructor' in value) {
            result[key] = this.transformEntityToObject(value);
          } else {
            result[key] = value;
          }
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Remove campos internos recursivamente de um objeto
   * @param obj - Objeto a ser processado
   * @param fieldsToRemove - Lista de campos a remover
   */
  private removeInternalFields(obj: any, fieldsToRemove: string[]): void {
    if (!obj || typeof obj !== 'object') return;

    for (const field of fieldsToRemove) {
      delete obj[field];
    }

    for (const key in obj) {
      if (key in obj) {
        const value = obj[key];

        if (value && typeof value === 'object') {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item && typeof item === 'object') {
                this.removeInternalFields(item, fieldsToRemove);
              }
            });
          } else {
            this.removeInternalFields(value, fieldsToRemove);
          }
        }
      }
    }
  }

  /**
   * Conta o número de campos em um objeto recursivamente
   * @param obj - Objeto a ser contado
   * @returns Número de campos
   */
  private countFields(obj: any): number {
    if (!obj || typeof obj !== 'object') return 0;

    let count = 0;

    for (const key in obj) {
      if (key in obj) {
        const value = obj[key];

        if (value === null || value === undefined) {
          continue;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          const nestedCount = this.countFields(
            value as Record<string, unknown>,
          );
          if (nestedCount > 0) {
            count += nestedCount;
          } else if (
            Object.keys(value as Record<string, unknown>).length === 0
          ) {
            continue;
          } else {
            count++;
          }
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            continue;
          }
          value.forEach((item) => {
            if (item && typeof item === 'object') {
              count += this.countFields(item);
            } else if (item !== null && item !== undefined) {
              count++;
            }
          });
        } else {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Validates audit log data before persistence
   * @param auditLogData - The audit log data to validate
   * @returns true if data is valid, false otherwise
   */
  private validateAuditLogData(auditLogData: IAuditLogData): boolean {
    if (!auditLogData.action) {
      this.logger.error(
        `Audit log data validation failed: missing required field 'action'. Data: ${JSON.stringify({ entityType: auditLogData.entityType, status: auditLogData.status })}`,
      );
      return false;
    }

    if (!auditLogData.entityType) {
      this.logger.error(
        `Audit log data validation failed: missing required field 'entityType'. Data: ${JSON.stringify({ action: auditLogData.action, status: auditLogData.status })}`,
      );
      return false;
    }

    if (!auditLogData.status) {
      this.logger.error(
        `Audit log data validation failed: missing required field 'status'. Data: ${JSON.stringify({ action: auditLogData.action, entityType: auditLogData.entityType })}`,
      );
      return false;
    }

    if (
      auditLogData.status === AuditLogStatus.FAILURE &&
      auditLogData.errorCode &&
      typeof auditLogData.errorCode !== 'string'
    ) {
      this.logger.warn(
        `Invalid errorCode type: ${typeof auditLogData.errorCode}. Converting to string.`,
      );
      auditLogData.errorCode = String(auditLogData.errorCode);
    }

    if (
      auditLogData.status === AuditLogStatus.FAILURE &&
      (!auditLogData.errorMessage ||
        typeof auditLogData.errorMessage !== 'string')
    ) {
      this.logger.warn(
        `Invalid or missing errorMessage for failed operation. Setting default message.`,
      );
      auditLogData.errorMessage = 'Unknown error occurred';
    }

    if (auditLogData.entityId) {
      if (typeof auditLogData.entityId !== 'string') {
        this.logger.warn(
          `Invalid entityId type: ${typeof auditLogData.entityId}. Converting to string.`,
        );
        auditLogData.entityId = String(auditLogData.entityId);
      }

      if (auditLogData.entityId.trim() === '') {
        this.logger.warn('Empty entityId found. Setting to undefined.');
        auditLogData.entityId = undefined;
      }
    }

    return true;
  }

  private processAuditLogSync(
    response: any,
    auditLogData: IAuditLogData,
    auditOptions: AuditOptions,
    request: any,
  ): void {
    if (!auditLogData.entityId && auditOptions.entityIdParam) {
      const responseEntityId = this.extractEntityIdFromResponse(response);
      if (responseEntityId) {
        auditLogData.entityId = responseEntityId;
      }
    }

    if (auditOptions.captureNewValues && response) {
      try {
        let sanitizedResponse = SanitizeDataHelper.sanitize(response) as Record<
          string,
          unknown
        >;

        if (auditOptions.ignoreFields && auditOptions.ignoreFields.length > 0) {
          sanitizedResponse = SanitizeDataHelper.removeFields(
            sanitizedResponse,
            auditOptions.ignoreFields,
          ) as Record<string, unknown>;
        }

        if (Object.keys(sanitizedResponse).length > 0) {
          auditLogData.newValues = {
            ...auditLogData.newValues,
            ...sanitizedResponse,
          };
        }
      } catch (error) {
        this.logger.warn(
          `Failed to capture response values: ${error.message}`,
          error.stack,
        );
      }
    }

    if (
      !auditLogData.userId &&
      auditOptions.action !== AuditAction.USER_LOGIN &&
      auditOptions.action !== AuditAction.USER_LOGIN_FAILED
    ) {
      this.logger.warn(
        `UserId not available for audit log: ${auditOptions.action} on ${request.method} ${request.url}. UserId should be available for authenticated endpoints.`,
      );
    }

    if (!this.validateAuditLogData(auditLogData)) {
      this.logger.error(
        `Validation failed for audit log data. Skipping persistence. Action: ${auditLogData.action}, EntityType: ${auditLogData.entityType}, Status: ${auditLogData.status}`,
      );
      return;
    }

    this.auditService.log(auditLogData).catch((error) => {
      this.logger.error(
        `Failed to create audit log in processAuditLogSync: action=${auditLogData.action}, entityType=${auditLogData.entityType}, error=${error.message}, stack=${error.stack?.substring(0, 500)}`,
        error.stack,
      );
    });
  }
}
