import { AuditAction } from '../enums/audit-action.enum';
import { AuditLogStatus } from '../enums/audit-log-status.enum';

export interface IAuditLogData {
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
}
