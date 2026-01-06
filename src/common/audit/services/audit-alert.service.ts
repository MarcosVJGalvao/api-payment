import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AuditLogStatus } from '../enums/audit-log-status.enum';
import { subHours } from 'date-fns';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditAlert } from '../interfaces/audit-alert.interface';

@Injectable()
export class AuditAlertService {
  private readonly logger = new Logger(AuditAlertService.name);
  private readonly alertEnabled: boolean;
  private readonly checkInterval: number;

  private readonly loginFailureThreshold = 20;
  private readonly massDeletionThreshold = 50;
  private readonly passwordChangeThreshold = 20;
  private readonly unauthorizedAccessThreshold = 20;

  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly configService: ConfigService,
  ) {
    this.alertEnabled =
      this.configService.get<string>('AUDIT_ALERT_ENABLED', 'true') === 'true';
    this.checkInterval = this.configService.get<number>(
      'AUDIT_ALERT_CHECK_INTERVAL',
      600000,
    );
  }

  @Cron('*/10 * * * *')
  async checkSuspiciousActivities(): Promise<void> {
    if (!this.alertEnabled) {
      return;
    }

    this.logger.log('Checking for suspicious activities...');

    try {
      const alerts = await this.detectSuspiciousActivities();

      for (const alert of alerts) {
        this.logger.warn(
          `Alert: ${alert.type} - ${alert.message}`,
          alert.details,
        );
      }

      if (alerts.length > 0) {
        this.logger.log(`Detected ${alerts.length} suspicious activities`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to check suspicious activities: ${error.message}`,
        error.stack,
      );
    }
  }

  async detectSuspiciousActivities(): Promise<AuditAlert[]> {
    const alerts: AuditAlert[] = [];

    const [
      loginFailures,
      massDeletions,
      unauthorizedAccesses,
      passwordChanges,
      unusualActivities,
    ] = await Promise.all([
      this.detectMultipleLoginFailures(),
      this.detectMassDeletions(),
      this.detectUnauthorizedAccess(),
      this.detectPasswordChangeAbuse(),
      this.detectUnusualActivity(),
    ]);

    alerts.push(...loginFailures);
    alerts.push(...massDeletions);
    alerts.push(...unauthorizedAccesses);
    alerts.push(...passwordChanges);
    alerts.push(...unusualActivities);

    return alerts;
  }

  private async detectMultipleLoginFailures(): Promise<AuditAlert[]> {
    const alerts: AuditAlert[] = [];
    const fifteenMinutesAgo = subHours(new Date(), 0.25);

    const counts =
      await this.auditLogRepository.countLoginFailures(fifteenMinutesAgo);

    const failuresByIp: Record<string, number> = {};
    const failuresByUsername: Record<string, number> = {};

    for (const record of counts) {
      const count = parseInt(record.count, 10);
      if (record.ipAddress) {
        failuresByIp[record.ipAddress] =
          (failuresByIp[record.ipAddress] || 0) + count;
      }
      if (record.username) {
        failuresByUsername[record.username] =
          (failuresByUsername[record.username] || 0) + count;
      }
    }

    for (const [ip, count] of Object.entries(failuresByIp)) {
      if (count >= this.loginFailureThreshold) {
        alerts.push({
          type: 'MULTIPLE_LOGIN_FAILURES',
          severity: 'HIGH',
          message: `Multiple login failures detected from IP ${ip}`,
          details: {
            ip,
            count,
            threshold: this.loginFailureThreshold,
            timeWindow: '15 minutes',
          },
          timestamp: new Date(),
        });
      }
    }

    for (const [username, count] of Object.entries(failuresByUsername)) {
      if (count >= this.loginFailureThreshold) {
        alerts.push({
          type: 'MULTIPLE_LOGIN_FAILURES',
          severity: 'HIGH',
          message: `Multiple login failures detected for username ${username}`,
          details: {
            username,
            count,
            threshold: this.loginFailureThreshold,
            timeWindow: '15 minutes',
          },
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  private async detectMassDeletions(): Promise<AuditAlert[]> {
    const alerts: AuditAlert[] = [];
    const oneHourAgo = subHours(new Date(), 1);

    const counts = await this.auditLogRepository.countMassDeletions(oneHourAgo);

    for (const record of counts) {
      const count = parseInt(record.count, 10);
      if (count >= this.massDeletionThreshold) {
        alerts.push({
          type: 'MASS_DELETION',
          severity: 'CRITICAL',
          message: `Mass deletion detected by user ${record.userId}`,
          details: {
            userId: record.userId,
            count,
            threshold: this.massDeletionThreshold,
            timeWindow: '1 hour',
          },
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  private async detectUnauthorizedAccess(): Promise<AuditAlert[]> {
    const alerts: AuditAlert[] = [];
    const oneHourAgo = subHours(new Date(), 1);

    const counts = await this.auditLogRepository.countUnauthorizedAccesses(
      oneHourAgo,
      AuditLogStatus.FAILURE,
    );

    const unauthorizedLogs = counts.filter((log) => {
      const errorMessage = log.errorMessage?.toLowerCase() || '';
      return (
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('permission denied')
      );
    });

    const accessesByIp: Record<string, number> = {};
    const accessesByUser: Record<string, number> = {};

    for (const record of unauthorizedLogs) {
      const count = parseInt(record.count, 10);
      if (record.ipAddress) {
        accessesByIp[record.ipAddress] =
          (accessesByIp[record.ipAddress] || 0) + count;
      }
      if (record.userId) {
        accessesByUser[record.userId] =
          (accessesByUser[record.userId] || 0) + count;
      }
    }

    for (const [ip, count] of Object.entries(accessesByIp)) {
      if (count >= this.unauthorizedAccessThreshold) {
        alerts.push({
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'HIGH',
          message: `Multiple unauthorized access attempts from IP ${ip}`,
          details: {
            ip,
            count,
            threshold: this.unauthorizedAccessThreshold,
            timeWindow: '1 hour',
          },
          timestamp: new Date(),
        });
      }
    }

    for (const [userId, count] of Object.entries(accessesByUser)) {
      if (count >= this.unauthorizedAccessThreshold) {
        alerts.push({
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'HIGH',
          message: `Multiple unauthorized access attempts by user ${userId}`,
          details: {
            userId,
            count,
            threshold: this.unauthorizedAccessThreshold,
            timeWindow: '1 hour',
          },
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  private async detectPasswordChangeAbuse(): Promise<AuditAlert[]> {
    const alerts: AuditAlert[] = [];
    const oneHourAgo = subHours(new Date(), 1);

    const counts =
      await this.auditLogRepository.countPasswordChanges(oneHourAgo);

    for (const record of counts) {
      const count = parseInt(record.count, 10);
      if (count >= this.passwordChangeThreshold) {
        alerts.push({
          type: 'PASSWORD_CHANGE_ABUSE',
          severity: 'MEDIUM',
          message: `Abnormal password change activity for user ${record.userId}`,
          details: {
            userId: record.userId,
            count,
            threshold: this.passwordChangeThreshold,
            timeWindow: '1 hour',
          },
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  private async detectUnusualActivity(): Promise<AuditAlert[]> {
    const alerts: AuditAlert[] = [];
    const oneHourAgo = subHours(new Date(), 1);

    const counts = await this.auditLogRepository.countAllActivity(oneHourAgo);

    const actionsByUser: Record<string, Record<string, number>> = {};

    for (const record of counts) {
      if (!actionsByUser[record.userId]) {
        actionsByUser[record.userId] = {};
      }
      actionsByUser[record.userId][record.action] = parseInt(record.count, 10);
    }

    const activityThreshold = 200;

    for (const [userId, actions] of Object.entries(actionsByUser)) {
      const totalActions = Object.values(actions).reduce(
        (sum, count) => sum + count,
        0,
      );

      if (totalActions >= activityThreshold) {
        alerts.push({
          type: 'UNUSUAL_ACTIVITY',
          severity: 'MEDIUM',
          message: `Unusual high activity detected for user ${userId}`,
          details: {
            userId,
            totalActions,
            threshold: activityThreshold,
            timeWindow: '1 hour',
            actionsBreakdown: actions,
          },
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }
}
