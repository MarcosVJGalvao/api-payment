import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { AuditLog } from '../entities/audit-log.entity';
import { IAuditLogData } from '../interfaces/audit-log.interface';
import { AuditAction } from '../enums/audit-action.enum';
import { QueryAuditLogDto } from '../dto/query-audit-log.dto';
import { AuditLogListItemDto } from '../dto/audit-log-list-item.dto';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { Request } from 'express';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
    private readonly baseQueryService: BaseQueryService,
  ) {}

  async log(data: IAuditLogData): Promise<AuditLog | null> {
    try {
      const auditLog = await this.auditLogRepository.create({
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        username: data.username,
        correlationId: data.correlationId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        description: data.description,
        status: data.status,
        errorMessage: data.errorMessage,
        errorCode: data.errorCode,
      });

      return auditLog;
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: action=${data.action}, entityType=${data.entityType}, entityId=${data.entityId || 'N/A'}, userId=${data.userId || 'N/A'}, error=${error.message}`,
        error.stack,
        'AuditService',
      );

      // Log detalhes adicionais do erro para diagnóstico
      if (error instanceof Error) {
        this.logger.error(
          `Error details: name=${error.name}, message=${error.message}, stack=${error.stack?.substring(0, 500)}`,
          'AuditService',
        );
      }

      return null;
    }
  }

  async logMany(dataArray: IAuditLogData[]): Promise<AuditLog[]> {
    try {
      const auditLogsData = dataArray.map((data) => ({
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        username: data.username,
        correlationId: data.correlationId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        description: data.description,
        status: data.status,
        errorMessage: data.errorMessage,
        errorCode: data.errorCode,
      }));

      const result = await this.auditLogRepository.createMany(auditLogsData);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create audit logs: count=${dataArray.length}, error=${error.message}`,
        error.stack,
        'AuditService',
      );
      return [];
    }
  }

  async findByEntity(
    entityType: string,
    entityId?: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    try {
      return await this.auditLogRepository.findByEntity(
        entityType,
        entityId,
        limit,
      );
    } catch (error) {
      this.logger.error(
        `Failed to find audit logs by entity: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async findByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      return await this.auditLogRepository.findByUser(userId, limit);
    } catch (error) {
      this.logger.error(
        `Failed to find audit logs by user: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async findByAction(
    action: AuditAction,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    try {
      return await this.auditLogRepository.findByAction(action, limit);
    } catch (error) {
      this.logger.error(
        `Failed to find audit logs by action: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async findByCorrelationId(correlationId: string): Promise<AuditLog[]> {
    try {
      return await this.auditLogRepository.findByCorrelationId(correlationId);
    } catch (error) {
      this.logger.error(
        `Failed to find audit logs by correlationId: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  extractIpAddress(request: Request): string | undefined {
    try {
      const forwardedFor = request.headers?.['x-forwarded-for'];
      if (forwardedFor) {
        const ips = String(forwardedFor)
          .split(',')
          .map((ip) => ip.trim());
        return ips[0];
      }

      const realIp = request.headers?.['x-real-ip'];
      if (realIp) {
        return String(realIp);
      }

      const cfConnectingIp = request.headers?.['cf-connecting-ip'];
      if (cfConnectingIp) {
        return String(cfConnectingIp);
      }

      if (request.ip) {
        return request.ip;
      }

      if (request.connection?.remoteAddress) {
        return request.connection.remoteAddress;
      }

      if (request.socket?.remoteAddress) {
        return request.socket.remoteAddress;
      }

      return undefined;
    } catch (error) {
      this.logger.warn(`Failed to extract IP address: ${error.message}`);
      return undefined;
    }
  }

  extractUserAgent(request: Request): string | undefined {
    try {
      const userAgent = request.headers?.['user-agent'];
      return userAgent ? String(userAgent) : undefined;
    } catch (error) {
      this.logger.warn(`Failed to extract user agent: ${error.message}`);
      return undefined;
    }
  }

  async findAllAuditLogs(
    queryDto: QueryAuditLogDto,
  ): Promise<PaginationResult<AuditLogListItemDto>> {
    // Garantir que o sortOrder padrão seja DESC para logs de auditoria
    const queryDtoWithDefaults = {
      ...queryDto,
      sortOrder: queryDto.sortOrder || 'DESC',
    };

    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.repository,
      queryDtoWithDefaults,
      {
        defaultSortBy: 'createdAt',
        dateField: 'createdAt',
        searchFields: [
          'username',
          'entityType',
          'description',
          'entityId',
          'userId',
          'correlationId',
        ],
        filters: [
          {
            field: 'action',
          },
          {
            field: 'status',
          },
        ],
        // Não usar select explícito - deixar TypeORM retornar todos os campos
        // O plainToInstance já filtra apenas os campos do DTO
      },
    );

    const result = await this.baseQueryService.findAll(
      this.repository,
      queryOptions,
    );

    const transformedData = result.data.map((log) => {
      const logData: any = {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        username: log.username ?? undefined,
        correlationId: log.correlationId ?? undefined,
        status: log.status,
        description: log.description ?? undefined,
        createdAt: log.createdAt,
      };

      return plainToInstance(AuditLogListItemDto, logData, {
        excludeExtraneousValues: false,
        exposeDefaultValues: true,
      });
    });

    return {
      data: transformedData,
      meta: result.meta,
    };
  }

  async getAuditLogById(id: string): Promise<AuditLog> {
    const auditLog = await this.repository.findOne({
      where: { id },
    });

    if (!auditLog) {
      throw new CustomHttpException(
        `Audit log with ID ${id} not found.`,
        HttpStatus.NOT_FOUND,
        ErrorCode.AUDIT_LOG_NOT_FOUND,
      );
    }

    return auditLog;
  }
}
