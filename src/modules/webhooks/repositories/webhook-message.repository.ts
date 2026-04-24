import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookMessage } from '../entities/webhook-message.entity';
import { OutboundWebhookMessageStatus } from '../enums/outbound-webhook-message-status.enum';
import type { QueryWebhookMessageDto } from '../dto/query-webhook-message.dto';

@Injectable()
export class WebhookMessageRepository {
  constructor(
    @InjectRepository(WebhookMessage)
    private readonly repo: Repository<WebhookMessage>,
  ) {}

  async create(data: Partial<WebhookMessage>): Promise<WebhookMessage> {
    const entity = this.repo.create(data as WebhookMessage);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<WebhookMessage | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(
    id: string,
    status: OutboundWebhookMessageStatus,
    extra?: Partial<WebhookMessage>,
  ): Promise<void> {
    await this.repo.update(id, { status, ...extra } as any);
  }

  async findByFilters(
    clientId: string,
    query: QueryWebhookMessageDto,
  ): Promise<[WebhookMessage[], number]> {
    const qb = this.repo
      .createQueryBuilder('wm')
      .where('wm.client_id = :clientId', { clientId });

    if (query.status) {
      qb.andWhere('wm.status = :status', { status: query.status });
    }
    if (query.eventType) {
      qb.andWhere('wm.event_type = :eventType', { eventType: query.eventType });
    }
    if (query.configurationId) {
      qb.andWhere('wm.configuration_id = :configurationId', {
        configurationId: query.configurationId,
      });
    }
    if (query.startDate) {
      qb.andWhere('wm.created_at >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('wm.created_at <= :endDate', { endDate: query.endDate });
    }

    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 10, 100);

    qb.orderBy('wm.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    return qb.getManyAndCount();
  }

  async findFailedByIds(
    ids: string[],
    clientId: string,
  ): Promise<WebhookMessage[]> {
    if (ids.length === 0) return [];
    return this.repo
      .createQueryBuilder('wm')
      .where('wm.id IN (:...ids)', { ids })
      .andWhere('wm.client_id = :clientId', { clientId })
      .andWhere('wm.status IN (:...statuses)', {
        statuses: [OutboundWebhookMessageStatus.FAILED],
      })
      .getMany();
  }

  async findFailedByConfigurationId(
    configurationId: string,
    clientId: string,
  ): Promise<WebhookMessage[]> {
    return this.repo.find({
      where: {
        configurationId,
        clientId,
        status: OutboundWebhookMessageStatus.FAILED,
      },
    });
  }
}
