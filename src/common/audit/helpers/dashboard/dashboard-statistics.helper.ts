import { AuditLog } from '../../entities/audit-log.entity';
import { AuditLogStatus } from '../../enums/audit-log-status.enum';
import { formatDateOnly } from '@/common/helpers/date.helpers';

/**
 * Normaliza o status do log para comparação
 * @param status - Status do log (pode ser enum, string, etc)
 * @returns Status normalizado como string ('Success' ou 'Failure')
 */
function normalizeStatus(status: unknown): string {
  if (!status) return '';
  // Se for o enum, converter primeiro
  if (status === AuditLogStatus.SUCCESS) return 'Success';
  if (status === AuditLogStatus.FAILURE) return 'Failure';
  // Converter para string e normalizar (case-insensitive)
  // Apenas tratar strings e valores primitivos
  if (typeof status !== 'string') {
    // Se não for string, tentar converter apenas se for primitivo
    if (
      typeof status === 'number' ||
      typeof status === 'boolean' ||
      typeof status === 'symbol'
    ) {
      return '';
    }
    // Se for objeto, não converter
    return '';
  }
  const statusStr = status.trim();
  const lowerStatus = statusStr.toLowerCase();
  if (lowerStatus === 'success') return 'Success';
  if (lowerStatus === 'failure') return 'Failure';
  // Se já for o valor correto, retornar como está
  if (statusStr === 'Success' || statusStr === 'Failure') return statusStr;
  return statusStr;
}

/**
 * Agrupa ações por tipo
 * @param logs - Array de logs de auditoria
 * @returns Objeto com contagem de ações por tipo
 */
export function groupActionsByType(logs: AuditLog[]): Record<string, number> {
  const actionsByType: Record<string, number> = {};

  for (const log of logs) {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
  }

  return actionsByType;
}

/**
 * Agrupa ações por dia
 * @param logs - Array de logs de auditoria
 * @returns Array com contagem de ações por dia ordenado por data
 */
export function groupActionsByDay(
  logs: AuditLog[],
): Array<{ date: string; count: number }> {
  const actionsByDay: Record<string, number> = {};

  for (const log of logs) {
    const date = formatDateOnly(log.createdAt);
    actionsByDay[date] = (actionsByDay[date] || 0) + 1;
  }

  return Object.entries(actionsByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Retorna os usuários com mais ações
 * @param logs - Array de logs de auditoria
 * @param limit - Número máximo de usuários a retornar (padrão: 10)
 * @returns Array com usuários ordenados por contagem de ações
 */
export function getTopUsers(
  logs: AuditLog[],
  limit: number = 10,
): Array<{ userId: string; username: string; count: number }> {
  const userCounts: Record<
    string,
    { userId: string; username: string; count: number }
  > = {};

  for (const log of logs) {
    if (!log.userId) continue;

    const key = log.userId;
    if (!userCounts[key]) {
      userCounts[key] = {
        userId: log.userId,
        username: log.username || 'Unknown',
        count: 0,
      };
    }
    userCounts[key].count++;
  }

  return Object.values(userCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Retorna as ações mais recentes
 * @param logs - Array de logs de auditoria
 * @param limit - Número máximo de ações a retornar (padrão: 20)
 * @returns Array com logs ordenados por data (mais recentes primeiro)
 */
export function getRecentActions(
  logs: AuditLog[],
  limit: number = 20,
): AuditLog[] {
  return logs
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Conta logs por status
 * @param logs - Array de logs de auditoria
 * @returns Objeto com contagem de logs bem-sucedidos e falhados
 */
export function countLogsByStatus(logs: AuditLog[]): {
  success: number;
  failure: number;
} {
  return {
    success: logs.filter((log) => normalizeStatus(log.status) === 'Success')
      .length,
    failure: logs.filter((log) => normalizeStatus(log.status) === 'Failure')
      .length,
  };
}

/**
 * Calcula a taxa de sucesso em percentual
 * @param logs - Array de logs de auditoria
 * @returns Taxa de sucesso (0-100)
 */
export function calculateSuccessRate(logs: AuditLog[]): number {
  if (logs.length === 0) return 0;
  const successCount = logs.filter(
    (log) => normalizeStatus(log.status) === 'Success',
  ).length;
  return Math.round((successCount / logs.length) * 100 * 100) / 100;
}

/**
 * Calcula a taxa de falha em percentual
 * @param logs - Array de logs de auditoria
 * @returns Taxa de falha (0-100)
 */
export function calculateFailureRate(logs: AuditLog[]): number {
  if (logs.length === 0) return 0;
  const failureCount = logs.filter(
    (log) => normalizeStatus(log.status) === 'Failure',
  ).length;
  return Math.round((failureCount / logs.length) * 100 * 100) / 100;
}

/**
 * Agrupa ações por hora do dia (0-23)
 * @param logs - Array de logs de auditoria
 * @returns Array com contagem de ações por hora
 */
export function groupActionsByHour(
  logs: AuditLog[],
): Array<{ hour: number; count: number }> {
  const actionsByHour: Record<number, number> = {};

  for (const log of logs) {
    const hour = log.createdAt.getHours();
    actionsByHour[hour] = (actionsByHour[hour] || 0) + 1;
  }

  // Garantir que todas as horas de 0-23 estejam presentes
  const result: Array<{ hour: number; count: number }> = [];
  for (let hour = 0; hour < 24; hour++) {
    result.push({
      hour,
      count: actionsByHour[hour] || 0,
    });
  }

  return result;
}

/**
 * Retorna as entidades mais acessadas
 * @param logs - Array de logs de auditoria
 * @param limit - Número máximo de entidades a retornar (padrão: 10)
 * @returns Array com entidades mais acessadas ordenadas por contagem
 */
export function getTopEntityTypes(
  logs: AuditLog[],
  limit: number = 10,
): Array<{ entityType: string; count: number }> {
  const entityCounts: Record<string, number> = {};

  for (const log of logs) {
    if (!log.entityType) continue;
    entityCounts[log.entityType] = (entityCounts[log.entityType] || 0) + 1;
  }

  return Object.entries(entityCounts)
    .map(([entityType, count]) => ({ entityType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Identifica os horários de pico de atividade
 * @param logs - Array de logs de auditoria
 * @param limit - Número máximo de horários a retornar (padrão: 5)
 * @returns Array com horários de pico ordenados por contagem
 */
export function getPeakHours(
  logs: AuditLog[],
  limit: number = 5,
): Array<{ hour: number; count: number }> {
  const actionsByHour = groupActionsByHour(logs);

  return actionsByHour
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
