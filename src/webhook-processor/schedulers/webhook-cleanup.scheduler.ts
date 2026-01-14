import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WebhookEventLogService } from '../services/webhook-event-log.service';

/**
 * Scheduler para limpeza automática de logs de webhook antigos.
 * Executa diariamente às 03:00 para deletar logs com mais de 60 dias.
 */
@Injectable()
export class WebhookCleanupScheduler {
  private readonly logger = new Logger(WebhookCleanupScheduler.name);

  constructor(private readonly logService: WebhookEventLogService) {}

  /**
   * Executa a limpeza de logs antigos diariamente às 03:00.
   */
  @Cron('0 3 * * *')
  async handleCleanup(): Promise<void> {
    this.logger.log('Starting webhook logs cleanup...');

    try {
      const deleted = await this.logService.cleanupOldLogs();
      this.logger.log(
        `Webhook logs cleanup completed: ${deleted} records deleted`,
      );
    } catch (error) {
      this.logger.error(
        `Webhook logs cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
