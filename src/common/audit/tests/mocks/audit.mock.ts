import { QueryAuditLogDto } from '../../dto/query-audit-log.dto';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditAction } from '../../enums/audit-action.enum';
import { AuditLogStatus } from '../../enums/audit-log-status.enum';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';

export const mockQueryAuditLogDto = (): QueryAuditLogDto => ({
  page: 1,
  limit: 10,
  action: AuditAction.USER_CREATED,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
});

export const mockAuditLog = (): AuditLog => {
  const auditLog = new AuditLog();
  auditLog.id = '9b520d8b-c836-42dd-90da-9a98e7f006fc';
  auditLog.action = AuditAction.USER_CREATED;
  auditLog.entityType = 'User';
  auditLog.entityId = '44f66582-641f-40cf-a9ac-4f661afb9a54';
  auditLog.userId = '0886d835-bb67-4085-9e33-69e36c040933';
  auditLog.username = 'admin';
  auditLog.correlationId = '206285ed-eb73-48da-a58f-012960bbc3e4';
  auditLog.oldValues = undefined;
  auditLog.newValues = {
    id: '44f66582-641f-40cf-a9ac-4f661afb9a54',
    status: 'Active',
    username: 'admin',
  };
  auditLog.ipAddress = '::1';
  auditLog.userAgent = 'Apidog/1.0.0 (https://apidog.com)';
  auditLog.description = 'Created a user';
  auditLog.status = AuditLogStatus.SUCCESS;
  auditLog.errorMessage = undefined;
  auditLog.errorCode = undefined;
  auditLog.createdAt = new Date('2025-11-08T01:37:33.000Z');
  return auditLog;
};

export const mockPaginationResult = (
  data: AuditLog[] = [mockAuditLog()],
): PaginationResult<AuditLog> => ({
  data,
  meta: {
    page: 1,
    limit: 10,
    total: data.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});
