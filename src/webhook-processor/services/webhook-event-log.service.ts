import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { WebhookEventLog } from '../entities/webhook-event-log.entity';
import { CreateWebhookEventLogDto } from '../dto/create-webhook-event-log.dto';
import { getCurrentDate } from '@/common/helpers/date.helpers';

@Injectable()
export class WebhookEventLogService {
  private readonly logger = new Logger(WebhookEventLogService.name);

  private readonly RETENTION_DAYS = 60;

  constructor(
    @InjectRepository(WebhookEventLog)
    private readonly repository: Repository<WebhookEventLog>,
  ) {}

  async getLastProcessedEvent(
    authenticationCode: string,
  ): Promise<string | null> {
    const lastLog = await this.repository.findOne({
      where: {
        authenticationCode,
        wasProcessed: true,
      },
      order: { createdAt: 'DESC' },
    });

    return lastLog?.eventName || null;
  }

  async getLastProcessedEventByClient(
    authenticationCode: string,
    clientId: string,
  ): Promise<string | null> {
    const lastLog = await this.repository.findOne({
      where: {
        authenticationCode,
        clientId,
        wasProcessed: true,
      },
      order: { createdAt: 'DESC' },
    });

    return lastLog?.eventName || null;
  }

  async logEvent(data: CreateWebhookEventLogDto): Promise<WebhookEventLog> {
    const log = this.repository.create(data);
    const saved = await this.repository.save(log);

    if (!data.wasProcessed) {
      this.logger.warn(
        `Webhook event skipped: ${data.eventName} for ${data.authenticationCode} - ${data.skipReason}`,
      );
    } else {
      this.logger.debug(
        `Webhook event logged: ${data.eventName} for ${data.authenticationCode}`,
      );
    }

    return saved;
  }

  async findByClient(
    clientId: string,
    authenticationCode?: string,
  ): Promise<WebhookEventLog[]> {
    const where: Record<string, unknown> = { clientId };

    if (authenticationCode) {
      where.authenticationCode = authenticationCode;
    }

    return this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async cleanupOldLogs(): Promise<number> {
    const cutoffDate = getCurrentDate();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    const result = await this.repository.delete({
      createdAt: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  async hasLogs(authenticationCode: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { authenticationCode },
    });
    return count > 0;
  }
}
