import { AuditLog } from '../../entities/audit-log.entity';
import { AuditLogListItemDto } from '../../dto/audit-log-list-item.dto';

export function toAuditLogSummary(log: AuditLog): AuditLogListItemDto {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    username: log.username ?? undefined,
    correlationId: log.correlationId ?? undefined,
    status: log.status,
    description: log.description ?? undefined,
    createdAt: log.createdAt,
  };
}

export function toAuditLogSummaryArray(
  logs: AuditLog[],
): AuditLogListItemDto[] {
  return logs.map(toAuditLogSummary);
}
