import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../enums/audit-action.enum';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  action: AuditAction;
  entityType: string;
  description?: string;
  captureOldValues?: boolean;
  captureNewValues?: boolean;
  ignoreFields?: string[];
  entityIdParam?: string;
}

export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
