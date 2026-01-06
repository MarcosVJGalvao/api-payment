import { Injectable, Logger } from '@nestjs/common';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditDashboardQueryDto } from '../dto/audit-dashboard.dto';
import {
  groupActionsByType,
  groupActionsByDay,
  getTopUsers,
  countLogsByStatus,
  calculateSuccessRate,
  calculateFailureRate,
  groupActionsByHour,
  getTopEntityTypes,
  getPeakHours,
} from '../helpers/dashboard/dashboard-statistics.helper';
import { toAuditLogSummaryArray } from '../helpers/dashboard/audit-log-summary.helper';
import { DashboardStats } from '../interfaces/dashboard-stats.interface';
import { AuditLogRepository } from '../repositories/audit-log.repository';

@Injectable()
export class AuditDashboardService {
  private readonly logger = new Logger(AuditDashboardService.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async getDashboardStats(
    dto: AuditDashboardQueryDto,
  ): Promise<DashboardStats> {
    try {
      const { startDate, endDate, recentActivityLimit = 10 } = dto;

      const allLogs: AuditLog[] = await this.auditLogRepository.findAllForStats(
        {
          startDate,
          endDate,
        },
      );

      const { success: successLogs, failure: failureLogs } =
        countLogsByStatus(allLogs);

      const recentLogs = allLogs
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, recentActivityLimit);

      const statistics = {
        totalLogs: allLogs.length,
        successLogs,
        failureLogs,
        successRate: calculateSuccessRate(allLogs),
        failureRate: calculateFailureRate(allLogs),
        actionsByType: groupActionsByType(allLogs),
        actionsByDay: groupActionsByDay(allLogs),
        actionsByHour: groupActionsByHour(allLogs),
        topUsers: getTopUsers(allLogs, 10),
        topEntityTypes: getTopEntityTypes(allLogs, 10),
        peakHours: getPeakHours(allLogs, 5),
        recentActivity: toAuditLogSummaryArray(recentLogs),
      };

      return {
        statistics,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get dashboard stats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
