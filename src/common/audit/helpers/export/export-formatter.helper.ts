import { AuditLog } from '../../entities/audit-log.entity';
import { transformToISO } from '@/common/helpers/date.helpers';

/**
 * Formata logs de auditoria para JSON
 * @param logs - Array de logs de auditoria
 * @returns String JSON formatada
 */
export function formatToJSON(logs: AuditLog[]): string {
  return JSON.stringify(logs, null, 2);
}

/**
 * Formata logs de auditoria para CSV
 * @param logs - Array de logs de auditoria
 * @returns String CSV com cabeçalhos e dados
 */
export function formatToCSV(logs: AuditLog[]): string {
  if (logs.length === 0) {
    return '';
  }

  const headers = [
    'id',
    'action',
    'entityType',
    'entityId',
    'userId',
    'username',
    'correlationId',
    'oldValues',
    'newValues',
    'ipAddress',
    'userAgent',
    'description',
    'status',
    'errorMessage',
    'errorCode',
    'createdAt',
  ];

  const rows = logs.map((log) => [
    log.id,
    log.action,
    log.entityType,
    log.entityId || '',
    log.userId || '',
    log.username || '',
    log.correlationId || '',
    log.oldValues ? JSON.stringify(log.oldValues) : '',
    log.newValues ? JSON.stringify(log.newValues) : '',
    log.ipAddress || '',
    log.userAgent || '',
    log.description || '',
    log.status,
    log.errorMessage || '',
    log.errorCode || '',
    transformToISO(log.createdAt),
  ]);

  const csvRows = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
  );

  return csvRows.join('\n');
}
