import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WebhookEventLog } from '@/webhook-processor/entities/webhook-event-log.entity';
import { AuditLog } from '@/common/audit/entities/audit-log.entity';
import { getCurrentDate } from '@/common/helpers/date.helpers';

/**
 * Serviço responsável pela limpeza periódica de logs antigos.
 * Remove registros em lote para evitar locks longos no banco de dados.
 */
@Injectable()
export class LogCleanupService {
  private readonly logger = new Logger(LogCleanupService.name);

  private readonly webhookLogRetentionDays: number;
  private readonly auditLogRetentionDays: number;
  private readonly cleanupBatchSize: number;

  constructor(
    @InjectRepository(WebhookEventLog)
    private readonly webhookEventLogRepository: Repository<WebhookEventLog>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {
    this.webhookLogRetentionDays = this.configService.get<number>(
      'WEBHOOK_LOG_RETENTION_DAYS',
      60,
    );
    this.auditLogRetentionDays = this.configService.get<number>(
      'AUDIT_LOG_RETENTION_DAYS',
      90,
    );
    this.cleanupBatchSize = this.configService.get<number>(
      'LOG_CLEANUP_BATCH_SIZE',
      500,
    );
  }

  /**
   * Executa limpeza de logs de webhook todos os dias às 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanWebhookLogs(): Promise<void> {
    this.logger.log('Starting webhook logs cleanup...');

    const cutoffDate = this.getCutoffDate(this.webhookLogRetentionDays);
    let totalDeleted = 0;
    let deletedInBatch: number;

    do {
      deletedInBatch = await this.deleteWebhookLogsBatch(cutoffDate);
      totalDeleted += deletedInBatch;

      if (deletedInBatch > 0) {
        this.logger.debug(
          `Deleted ${deletedInBatch} webhook logs (total: ${totalDeleted})`,
        );
      }
    } while (deletedInBatch === this.cleanupBatchSize);

    this.logger.log(
      `Webhook logs cleanup completed. Total deleted: ${totalDeleted}`,
    );
  }

  /**
   * Executa limpeza de logs de auditoria todos os dias às 4:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanAuditLogs(): Promise<void> {
    this.logger.log('Starting audit logs cleanup...');

    const cutoffDate = this.getCutoffDate(this.auditLogRetentionDays);
    let totalDeleted = 0;
    let deletedInBatch: number;

    do {
      deletedInBatch = await this.deleteAuditLogsBatch(cutoffDate);
      totalDeleted += deletedInBatch;

      if (deletedInBatch > 0) {
        this.logger.debug(
          `Deleted ${deletedInBatch} audit logs (total: ${totalDeleted})`,
        );
      }
    } while (deletedInBatch === this.cleanupBatchSize);

    this.logger.log(
      `Audit logs cleanup completed. Total deleted: ${totalDeleted}`,
    );
  }

  /**
   * Calcula a data de corte baseado nos dias de retenção
   */
  private getCutoffDate(retentionDays: number): Date {
    const cutoff = getCurrentDate();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    return cutoff;
  }

  /**
   * Deleta um lote de logs de webhook anteriores à data de corte
   */
  private async deleteWebhookLogsBatch(cutoffDate: Date): Promise<number> {
    const logsToDelete = await this.webhookEventLogRepository.find({
      where: { createdAt: LessThan(cutoffDate) },
      take: this.cleanupBatchSize,
      select: ['id'],
    });

    if (logsToDelete.length === 0) {
      return 0;
    }

    const ids = logsToDelete.map((log) => log.id);
    await this.webhookEventLogRepository.delete(ids);

    return logsToDelete.length;
  }

  /**
   * Deleta um lote de logs de auditoria anteriores à data de corte
   */
  private async deleteAuditLogsBatch(cutoffDate: Date): Promise<number> {
    const logsToDelete = await this.auditLogRepository.find({
      where: { createdAt: LessThan(cutoffDate) },
      take: this.cleanupBatchSize,
      select: ['id'],
    });

    if (logsToDelete.length === 0) {
      return 0;
    }

    const ids = logsToDelete.map((log) => log.id);
    await this.auditLogRepository.delete(ids);

    return logsToDelete.length;
  }
}
