import { AuditLogListItemDto } from '../dto/audit-log-list-item.dto';

export interface DashboardStats {
  statistics: {
    totalLogs: number;
    successLogs: number;
    failureLogs: number;
    successRate: number;
    failureRate: number;
    actionsByType: Record<string, number>;
    actionsByDay: Array<{ date: string; count: number }>;
    actionsByHour: Array<{ hour: number; count: number }>;
    topUsers: Array<{ userId: string; username: string; count: number }>;
    topEntityTypes: Array<{ entityType: string; count: number }>;
    peakHours: Array<{ hour: number; count: number }>;
    recentActivity: AuditLogListItemDto[];
  };
}
