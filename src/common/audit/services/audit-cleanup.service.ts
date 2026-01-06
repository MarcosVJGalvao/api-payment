import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AuditLogStatus } from '../enums/audit-log-status.enum';
import { subDays } from 'date-fns';
import { AuditLogRepository } from '../repositories/audit-log.repository';

@Injectable()
export class AuditCleanupService {
  private readonly logger = new Logger(AuditCleanupService.name);
  private readonly retentionDays: number;
  private readonly failedRetentionDays: number;

  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly configService: ConfigService,
  ) {
    this.retentionDays = this.configService.get<number>(
      'AUDIT_LOG_RETENTION_DAYS',
      90,
    );
    this.failedRetentionDays = this.configService.get<number>(
      'AUDIT_FAILED_LOG_RETENTION_DAYS',
      30,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs(): Promise<void> {
    this.logger.log('Starting cleanup of old audit logs...');

    try {
      const cutoffDate = subDays(new Date(), this.retentionDays);
      const result = await this.auditLogRepository.deleteOldLogs(
        AuditLogStatus.SUCCESS,
        cutoffDate,
      );

      this.logger.log(
        `Cleaned up ${result.affected} old audit logs (older than ${this.retentionDays} days)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old audit logs: ${error.message}`,
        error.stack,
      );
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async cleanupFailedLogs(): Promise<void> {
    this.logger.log('Starting cleanup of failed audit logs...');

    try {
      const cutoffDate = subDays(new Date(), this.failedRetentionDays);
      const result = await this.auditLogRepository.deleteOldLogs(
        AuditLogStatus.FAILURE,
        cutoffDate,
      );

      this.logger.log(
        `Cleaned up ${result.affected} failed audit logs (older than ${this.failedRetentionDays} days)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup failed audit logs: ${error.message}`,
        error.stack,
      );
    }
  }

  async cleanupManually(retentionDays?: number): Promise<number> {
    const days = retentionDays || this.retentionDays;
    const cutoffDate = subDays(new Date(), days);

    try {
      const result = await this.auditLogRepository.deleteAllOldLogs(cutoffDate);

      this.logger.log(
        `Manually cleaned up ${result.affected} audit logs (older than ${days} days)`,
      );

      return result.affected;
    } catch (error) {
      this.logger.error(
        `Failed to manually cleanup audit logs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async cleanupFailedManually(retentionDays?: number): Promise<number> {
    const days = retentionDays || this.failedRetentionDays;
    const cutoffDate = subDays(new Date(), days);

    try {
      const result = await this.auditLogRepository.deleteOldLogs(
        AuditLogStatus.FAILURE,
        cutoffDate,
      );

      this.logger.log(
        `Manually cleaned up ${result.affected} failed audit logs (older than ${days} days)`,
      );

      return result.affected;
    } catch (error) {
      this.logger.error(
        `Failed to manually cleanup failed audit logs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
