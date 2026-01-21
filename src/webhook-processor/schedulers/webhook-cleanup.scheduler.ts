import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhookEventLogService } from '../services/webhook-event-log.service';

@Injectable()
export class WebhookCleanupScheduler {
  private readonly logger = new Logger(WebhookCleanupScheduler.name);

  constructor(private readonly logService: WebhookEventLogService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
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
