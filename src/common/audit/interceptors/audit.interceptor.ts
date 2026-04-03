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
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AuditService } from '../services/audit.service';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { IAuditLogData } from '../interfaces/audit-log.interface';
import { SanitizeDataHelper } from '../helpers/sanitize-data.helper';
import { AuditLogStatus } from '../enums/audit-log-status.enum';
import { AuditAction } from '../enums/audit-action.enum';
import { JwtService } from '@nestjs/jwt';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import {
  mapHttpStatusToErrorCode,
  processUnhandledError,
} from '@/common/errors/helpers/error.helpers';
import { extractMessage } from '@/common/errors/helpers/message.helpers';
import { isRecord } from '@/common/errors/helpers/type.helpers';
import { AuditQueueAddOptions } from '@/queue/policies/queue-policy.accessors';

import { Webhook } from '@/webhook/entities/webhook.entity';

function hasErrorCode(value: unknown): value is { errorCode?: unknown } {
  return typeof value === 'object' && value !== null && 'errorCode' in value;
}

function hasErroCode(value: unknown): value is { erroCode?: unknown } {
  return typeof value === 'object' && value !== null && 'erroCode' in value;
}

function getStringField(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  private readonly entityClassMap: Record<string, EntityTarget<ObjectLiteral>> =
    {
      Webhook: Webhook,
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
    @InjectQueue('audit') private readonly auditQueue: Queue,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { correlationId?: string }>();
    const handler = context.getHandler();
    const auditOptions = this.reflector.get<AuditOptions>(AUDIT_KEY, handler);

    if (!auditOptions) {
      return next.handle();
    }

    const tokenIdentity = this.extractTokenIdentity(request);
    const resolvedIdentity = this.resolveRequestIdentity(
      request,
      tokenIdentity,
    );
    const userId = resolvedIdentity.userId;
    const username = resolvedIdentity.username;

    const isPublicEndpoint =
      auditOptions.action === AuditAction.USER_LOGIN ||
      auditOptions.action === AuditAction.USER_LOGIN_FAILED;

    if (!userId && !isPublicEndpoint) {
      this.logger.warn(
        `UserId not available for audit log: ${auditOptions.action} on ${request.method} ${request.url}. UserId should be available for authenticated endpoints.`,
      );
    }

    const correlationId = request.correlationId;
    const ipAddress = this.auditService.extractIpAddress(request);
    const userAgent = this.auditService.extractUserAgent(request);

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

    const newValues = auditOptions.captureNewValues
      ? this.extractNewValues(request.body, auditOptions.ignoreFields)
      : undefined;

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
                    if (isRecord(decoded)) {
                      const decodedUserId = getStringField(decoded, 'userId');
                      const decodedUsername = getStringField(
                        decoded,
                        'username',
                      );

                      if (decodedUserId) {
                        if (!auditLogData.userId) {
                          auditLogData.userId = decodedUserId;
                        }

                        if (!auditLogData.entityId) {
                          auditLogData.entityId = decodedUserId;
                        }
                      }

                      if (!auditLogData.username && decodedUsername) {
                        auditLogData.username = decodedUsername;
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

              if (hasErrorCode(exceptionResponse)) {
                auditLogData.errorCode = String(exceptionResponse.errorCode);
              } else if (hasErroCode(exceptionResponse)) {
                auditLogData.errorCode = String(exceptionResponse.erroCode);
              }

              if (!auditLogData.errorCode) {
                const status = error.getStatus();
                const mappedErrorCode = mapHttpStatusToErrorCode(status);
                auditLogData.errorCode = String(mappedErrorCode);
              }
            } else {
              const errorResult = processUnhandledError(
                error instanceof Error ? error : new Error(String(error)),
              );
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
              this.auditQueue
                .add('log', auditLogData, AuditQueueAddOptions)
                .catch((logError) => {
                  this.logger.error(
                    `Failed to add audit log to queue in error handler: action=${auditLogData.action}, entityType=${auditLogData.entityType}, error=${logError.message}`,
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

  private resolveRequestIdentity(
    request: Request,
    tokenIdentity?: { userId?: string; username?: string },
  ): { userId?: string; username?: string } {
    const userRecord = isRecord(request.user) ? request.user : undefined;
    const directUserId = userRecord
      ? getStringField(userRecord, 'userId')
      : undefined;
    const subUserId = userRecord
      ? getStringField(userRecord, 'sub')
      : undefined;
    const directUsername = userRecord
      ? getStringField(userRecord, 'username')
      : undefined;
    const emailUsername = userRecord
      ? getStringField(userRecord, 'email')
      : undefined;

    let userId = directUserId || subUserId;
    let username = directUsername || emailUsername;

    if (!userId) {
      userId = this.extractUserIdFromProviderSession(request);
    }

    if (!userId && tokenIdentity?.userId) {
      userId = tokenIdentity.userId;
    }

    if (!username && tokenIdentity?.username) {
      username = tokenIdentity.username;
    }

    if (!username && isRecord(request.body)) {
      username = getStringField(request.body, 'username');
    }

    return { userId, username };
  }

  private extractUserIdFromProviderSession(
    request: Request,
  ): string | undefined {
    if (!('providerSession' in request) || !request.providerSession) {
      return undefined;
    }

    const providerSession = request.providerSession;
    if (!isRecord(providerSession)) {
      return undefined;
    }

    return (
      getStringField(providerSession, 'userId') ||
      getStringField(providerSession, 'accountId')
    );
  }

  private extractTokenIdentity(
    request: Request,
  ): { userId?: string; username?: string } | undefined {
    const authHeader = request.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const token = authHeader.substring(7);
      const decoded = this.jwtService.decode(String(token));
      if (!isRecord(decoded)) {
        return undefined;
      }

      const userId = getStringField(decoded, 'userId');
      const username = getStringField(decoded, 'username');
      if (!userId && !username) {
        return undefined;
      }

      return { userId, username };
    } catch {
      return undefined;
    }
  }

  private extractNewValues(
    body: unknown,
    ignoreFields?: string[],
  ): Record<string, unknown> | undefined {
    if (!body) {
      return undefined;
    }

    const sanitizedBody = SanitizeDataHelper.sanitize(body);
    let sanitizedRecord = isRecord(sanitizedBody) ? sanitizedBody : {};

    if (ignoreFields && ignoreFields.length > 0) {
      const removed = SanitizeDataHelper.removeFields(
        sanitizedRecord,
        ignoreFields,
      );
      sanitizedRecord = isRecord(removed) ? removed : {};
    }

    return Object.keys(sanitizedRecord).length > 0
      ? sanitizedRecord
      : undefined;
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

      const repository = this.dataSource.getRepository(EntityClass);

      const relations = this.entityRelationsMap[entityType] || [];

      const entity = await repository.findOne({
        where: { id: entityId },
        relations: relations.length > 0 ? relations : undefined,
      });

      if (!entity) {
        return undefined;
      }

      const entityObject = this.transformEntityToObject(entity);

      const sanitizedOldValues = SanitizeDataHelper.sanitize(entityObject);
      let sanitizedRecord = isRecord(sanitizedOldValues)
        ? sanitizedOldValues
        : {};

      if (ignoreFields && ignoreFields.length > 0) {
        const removed = SanitizeDataHelper.removeFields(
          sanitizedRecord,
          ignoreFields,
        );
        sanitizedRecord = isRecord(removed) ? removed : {};
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
      this.removeInternalFields(sanitizedRecord, internalFields);

      const fieldsCount = this.countFields(sanitizedRecord);
      if (fieldsCount > 0) {
        return sanitizedRecord;
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
  private countFields(obj: unknown): number {
    if (obj === null || obj === undefined) {
      return 0;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return 0;
      }

      let count = 0;
      for (const item of obj) {
        if (item && typeof item === 'object') {
          count += this.countFields(item);
        } else if (item !== null && item !== undefined) {
          count++;
        }
      }

      return count;
    }

    if (!isRecord(obj)) {
      return 0;
    }

    let count = 0;

    for (const key in obj) {
      if (key in obj) {
        const value = obj[key];

        if (value === null || value === undefined) {
          continue;
        } else if (isRecord(value)) {
          const nestedCount = this.countFields(value);
          if (nestedCount > 0) {
            count += nestedCount;
          } else if (Object.keys(value).length === 0) {
            continue;
          } else {
            count++;
          }
        } else if (Array.isArray(value)) {
          count += this.countFields(value);
        } else if (value !== null && value !== undefined) {
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
        const sanitizedResponse = SanitizeDataHelper.sanitize(response);
        let sanitizedRecord = isRecord(sanitizedResponse)
          ? sanitizedResponse
          : {};

        if (auditOptions.ignoreFields && auditOptions.ignoreFields.length > 0) {
          const removed = SanitizeDataHelper.removeFields(
            sanitizedRecord,
            auditOptions.ignoreFields,
          );
          sanitizedRecord = isRecord(removed) ? removed : {};
        }

        if (Object.keys(sanitizedRecord).length > 0) {
          auditLogData.newValues = {
            ...auditLogData.newValues,
            ...sanitizedRecord,
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

    this.auditQueue
      .add('log', auditLogData, AuditQueueAddOptions)
      .catch((error) => {
        this.logger.error(
          `Failed to add audit log to queue in processAuditLogSync: action=${auditLogData.action}, entityType=${auditLogData.entityType}, error=${error.message}`,
          error.stack,
        );
      });
  }
}
