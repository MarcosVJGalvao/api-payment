import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Or, Repository } from 'typeorm';
import { WebhookConfiguration } from '../entities/webhook-configuration.entity';
import type { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

@Injectable()
export class WebhookConfigurationRepository {
  constructor(
    @InjectRepository(WebhookConfiguration)
    private readonly repo: Repository<WebhookConfiguration>,
  ) {}

  async save(entity: Partial<WebhookConfiguration>): Promise<WebhookConfiguration> {
    return this.repo.save(entity as WebhookConfiguration);
  }

  async findById(id: string): Promise<WebhookConfiguration | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async findByIdWithPrivateKey(id: string): Promise<WebhookConfiguration | null> {
    return this.repo
      .createQueryBuilder('wc')
      .addSelect('wc.private_key')
      .where('wc.id = :id AND wc.deleted_at IS NULL', { id })
      .getOne();
  }

  async findByClientId(clientId: string): Promise<WebhookConfiguration[]> {
    return this.repo.find({
      where: { clientId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveForEvent(
    clientId: string,
    eventType: ApiPaymentWebhookEventType,
  ): Promise<WebhookConfiguration[]> {
    const now = new Date();
    return this.repo
      .createQueryBuilder('wc')
      .addSelect('wc.private_key')
      .where('wc.client_id = :clientId', { clientId })
      .andWhere('wc.event_type = :eventType', { eventType })
      .andWhere('wc.is_active = true')
      .andWhere('wc.deleted_at IS NULL')
      .andWhere(
        '(wc.circuit_breaker_open_until IS NULL OR wc.circuit_breaker_open_until < :now)',
        { now },
      )
      .getMany();
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async update(
    id: string,
    data: Partial<WebhookConfiguration>,
  ): Promise<WebhookConfiguration | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
