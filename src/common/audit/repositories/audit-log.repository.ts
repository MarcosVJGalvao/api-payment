import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import {
  PaginationResult,
  PaginationMeta,
} from '@/common/base-query/interfaces/pagination-result.interface';
import { QueryAuditLogDto } from '../dto/query-audit-log.dto';
import { AuditExportDto } from '../dto/audit-export.dto';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditLogStatus } from '../enums/audit-log-status.enum';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async create(data: {
    action: AuditAction;
    entityType: string;
    entityId?: string;
    userId?: string;
    username?: string;
    correlationId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
    status: AuditLogStatus;
    errorMessage?: string;
    errorCode?: string;
  }): Promise<AuditLog> {
    try {
      const auditLog = this.repository.create(data);
      const saved = await this.repository.save(auditLog);
      return saved;
    } catch (error) {
      // Re-throw com mais contexto para que o AuditService possa logar adequadamente
      throw new CustomHttpException(
        `Failed to save audit log to database: ${error instanceof Error ? error.message : String(error)}. Data: action=${data.action}, entityType=${data.entityType}, status=${data.status}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createMany(
    dataArray: Array<{
      action: AuditAction;
      entityType: string;
      entityId?: string;
      userId?: string;
      username?: string;
      correlationId?: string;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      description?: string;
      status: AuditLogStatus;
      errorMessage?: string;
      errorCode?: string;
    }>,
  ): Promise<AuditLog[]> {
    const auditLogs = this.repository.create(dataArray);
    return await this.repository.save(auditLogs);
  }

  private calculatePaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<AuditLog>,
    alias: string,
    filters: {
      action?: string;
      entityType?: string;
      entityId?: string;
      userId?: string;
      correlationId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): void {
    let hasWhere = false;

    if (filters.startDate && filters.endDate) {
      queryBuilder.where(`${alias}.createdAt >= :startDate`, {
        startDate: filters.startDate,
      });
      queryBuilder.andWhere(`${alias}.createdAt <= :endDate`, {
        endDate: filters.endDate,
      });
      hasWhere = true;
    } else if (filters.startDate) {
      queryBuilder.where(`${alias}.createdAt >= :startDate`, {
        startDate: filters.startDate,
      });
      hasWhere = true;
    } else if (filters.endDate) {
      queryBuilder.where(`${alias}.createdAt <= :endDate`, {
        endDate: filters.endDate,
      });
      hasWhere = true;
    }

    if (filters.action) {
      if (hasWhere) {
        queryBuilder.andWhere(`${alias}.action = :action`, {
          action: filters.action,
        });
      } else {
        queryBuilder.where(`${alias}.action = :action`, {
          action: filters.action,
        });
        hasWhere = true;
      }
    }

    if (filters.entityType) {
      if (hasWhere) {
        queryBuilder.andWhere(`${alias}.entityType = :entityType`, {
          entityType: filters.entityType,
        });
      } else {
        queryBuilder.where(`${alias}.entityType = :entityType`, {
          entityType: filters.entityType,
        });
        hasWhere = true;
      }
    }

    if (filters.entityId) {
      if (hasWhere) {
        queryBuilder.andWhere(`${alias}.entityId = :entityId`, {
          entityId: filters.entityId,
        });
      } else {
        queryBuilder.where(`${alias}.entityId = :entityId`, {
          entityId: filters.entityId,
        });
        hasWhere = true;
      }
    }

    if (filters.userId) {
      if (hasWhere) {
        queryBuilder.andWhere(`${alias}.userId = :userId`, {
          userId: filters.userId,
        });
      } else {
        queryBuilder.where(`${alias}.userId = :userId`, {
          userId: filters.userId,
        });
        hasWhere = true;
      }
    }

    if (filters.correlationId) {
      if (hasWhere) {
        queryBuilder.andWhere(`${alias}.correlationId = :correlationId`, {
          correlationId: filters.correlationId,
        });
      } else {
        queryBuilder.where(`${alias}.correlationId = :correlationId`, {
          correlationId: filters.correlationId,
        });
        hasWhere = true;
      }
    }
  }

  async findAllWithFilters(
    dto: QueryAuditLogDto,
  ): Promise<PaginationResult<AuditLog>> {
    const alias = 'auditLog';
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      action,
      startDate,
      endDate,
    } = dto;

    const queryBuilder = this.repository.createQueryBuilder(alias);

    this.applyFilters(queryBuilder, alias, {
      action,
      startDate,
      endDate,
    });

    const validSortFields = [
      'id',
      'action',
      'entityType',
      'entityId',
      'userId',
      'username',
      'correlationId',
      'status',
      'createdAt',
    ];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`${alias}.${finalSortBy}`, finalSortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const meta = this.calculatePaginationMeta(page, limit, total);

    return { data, meta };
  }

  async findAllForExport(dto: AuditExportDto): Promise<AuditLog[]> {
    const alias = 'auditLog';
    const { action, entityType, entityId, userId, startDate, endDate } = dto;

    const queryBuilder = this.repository.createQueryBuilder(alias);

    this.applyFilters(queryBuilder, alias, {
      action,
      entityType,
      entityId,
      userId,
      startDate,
      endDate,
    });

    queryBuilder.orderBy(`${alias}.createdAt`, 'DESC');

    return await queryBuilder.getMany();
  }

  async findByEntity(
    entityType: string,
    entityId?: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const alias = 'auditLog';
    const queryBuilder = this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.entityType = :entityType`, { entityType })
      .orderBy(`${alias}.createdAt`, 'DESC')
      .limit(limit);

    if (entityId) {
      queryBuilder.andWhere(`${alias}.entityId = :entityId`, { entityId });
    }

    return await queryBuilder.getMany();
  }

  async findByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    const alias = 'auditLog';
    return await this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.userId = :userId`, { userId })
      .orderBy(`${alias}.createdAt`, 'DESC')
      .limit(limit)
      .getMany();
  }

  async findByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    const alias = 'auditLog';
    return await this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.action = :action`, { action })
      .orderBy(`${alias}.createdAt`, 'DESC')
      .limit(limit)
      .getMany();
  }

  async findByCorrelationId(correlationId: string): Promise<AuditLog[]> {
    const alias = 'auditLog';
    return await this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.correlationId = :correlationId`, { correlationId })
      .orderBy(`${alias}.createdAt`, 'ASC')
      .getMany();
  }

  async findByStatusAndDate(
    status: string,
    dateFrom: Date,
    dateTo?: Date,
  ): Promise<AuditLog[]> {
    const alias = 'auditLog';
    const queryBuilder = this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.status = :status`, { status })
      .andWhere(`${alias}.createdAt >= :dateFrom`, { dateFrom });

    if (dateTo) {
      queryBuilder.andWhere(`${alias}.createdAt <= :dateTo`, { dateTo });
    }

    return await queryBuilder.orderBy(`${alias}.createdAt`, 'DESC').getMany();
  }

  async findByActionAndDateRange(
    action: string,
    dateFrom: Date,
    dateTo?: Date,
  ): Promise<AuditLog[]> {
    const alias = 'auditLog';
    const queryBuilder = this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.action = :action`, { action })
      .andWhere(`${alias}.createdAt >= :dateFrom`, { dateFrom });

    if (dateTo) {
      queryBuilder.andWhere(`${alias}.createdAt <= :dateTo`, { dateTo });
    }

    return await queryBuilder.orderBy(`${alias}.createdAt`, 'DESC').getMany();
  }

  async deleteOldLogs(
    status: string,
    dateBefore: Date,
  ): Promise<{ affected: number }> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(AuditLog)
      .where('status = :status', { status })
      .andWhere('created_at < :dateBefore', { dateBefore })
      .execute();

    return { affected: result.affected || 0 };
  }

  async deleteAllOldLogs(dateBefore: Date): Promise<{ affected: number }> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(AuditLog)
      .where('created_at < :dateBefore', { dateBefore })
      .execute();

    return { affected: result.affected || 0 };
  }

  async findForDashboard(params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginationResult<AuditLog>> {
    const alias = 'auditLog';
    const {
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const queryBuilder = this.repository.createQueryBuilder(alias);

    if (startDate && endDate) {
      queryBuilder.where(`${alias}.createdAt >= :startDate`, {
        startDate,
      });
      queryBuilder.andWhere(`${alias}.createdAt <= :endDate`, { endDate });
    } else if (startDate) {
      queryBuilder.where(`${alias}.createdAt >= :startDate`, {
        startDate,
      });
    } else if (endDate) {
      queryBuilder.where(`${alias}.createdAt <= :endDate`, { endDate });
    }

    const validSortFields = [
      'id',
      'action',
      'entityType',
      'entityId',
      'userId',
      'username',
      'correlationId',
      'status',
      'createdAt',
    ];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`${alias}.${finalSortBy}`, finalSortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const meta = this.calculatePaginationMeta(page, limit, total);

    return { data, meta };
  }

  async findAllForStats(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLog[]> {
    const alias = 'auditLog';
    const { startDate, endDate } = params;

    const queryBuilder = this.repository.createQueryBuilder(alias);

    if (startDate && endDate) {
      queryBuilder.where(`${alias}.createdAt >= :startDate`, {
        startDate,
      });
      queryBuilder.andWhere(`${alias}.createdAt <= :endDate`, { endDate });
    } else if (startDate) {
      queryBuilder.where(`${alias}.createdAt >= :startDate`, {
        startDate,
      });
    } else if (endDate) {
      queryBuilder.where(`${alias}.createdAt <= :endDate`, { endDate });
    }

    return await queryBuilder.orderBy(`${alias}.createdAt`, 'DESC').getMany();
  }

  async findAllSinceDate(dateFrom: Date): Promise<AuditLog[]> {
    const alias = 'auditLog';
    return await this.repository
      .createQueryBuilder(alias)
      .where(`${alias}.createdAt >= :dateFrom`, { dateFrom })
      .orderBy(`${alias}.createdAt`, 'DESC')
      .getMany();
  }

  async countLoginFailures(dateFrom: Date): Promise<
    Array<{
      ipAddress: string;
      username: string;
      count: string;
    }>
  > {
    return await this.repository
      .createQueryBuilder('log')
      .select('log.ipAddress', 'ipAddress')
      .addSelect('log.username', 'username')
      .addSelect('COUNT(*)', 'count')
      .where('log.action = :action', { action: AuditAction.USER_LOGIN_FAILED })
      .andWhere('log.createdAt >= :dateFrom', { dateFrom })
      .groupBy('log.ipAddress')
      .addGroupBy('log.username')
      .getRawMany();
  }

  async countMassDeletions(dateFrom: Date): Promise<
    Array<{
      userId: string;
      count: string;
    }>
  > {
    return await this.repository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('log.action = :action', { action: AuditAction.USER_DELETED })
      .andWhere('log.createdAt >= :dateFrom', { dateFrom })
      .groupBy('log.userId')
      .getRawMany();
  }

  async countUnauthorizedAccesses(
    dateFrom: Date,
    status: AuditLogStatus,
  ): Promise<
    Array<{
      ipAddress: string;
      userId: string;
      errorMessage: string;
      count: string;
    }>
  > {
    // This one is trickier because of the filter in JS, but we can do a broad count
    return await this.repository
      .createQueryBuilder('log')
      .select('log.ipAddress', 'ipAddress')
      .addSelect('log.userId', 'userId')
      .addSelect('log.errorMessage', 'errorMessage')
      .addSelect('COUNT(*)', 'count')
      .where('log.status = :status', { status })
      .andWhere('log.createdAt >= :dateFrom', { dateFrom })
      .groupBy('log.ipAddress')
      .addGroupBy('log.userId')
      .addGroupBy('log.errorMessage')
      .getRawMany();
  }

  async countPasswordChanges(dateFrom: Date): Promise<
    Array<{
      userId: string;
      count: string;
    }>
  > {
    return await this.repository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('log.action = :action', {
        action: AuditAction.USER_PASSWORD_CHANGED,
      })
      .andWhere('log.createdAt >= :dateFrom', { dateFrom })
      .groupBy('log.userId')
      .getRawMany();
  }

  async countAllActivity(dateFrom: Date): Promise<
    Array<{
      userId: string;
      action: string;
      count: string;
    }>
  > {
    return await this.repository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :dateFrom', { dateFrom })
      .andWhere('log.userId IS NOT NULL')
      .groupBy('log.userId')
      .addGroupBy('log.action')
      .getRawMany();
  }
}
