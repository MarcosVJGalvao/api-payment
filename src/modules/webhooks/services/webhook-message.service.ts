import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { WebhookMessageRepository } from '../repositories/webhook-message.repository';
import { WebhookConfigurationRepository } from '../repositories/webhook-configuration.repository';
import { OutboundWebhookMessageStatus } from '../enums/outbound-webhook-message-status.enum';
import type { QueryWebhookMessageDto } from '../dto/query-webhook-message.dto';
import type { ReprocessWebhookMessagesDto } from '../dto/reprocess-webhook-messages.dto';
import type { WebhookMessage } from '../entities/webhook-message.entity';
import type { OutboundDeliveryJob } from '../interfaces/outbound-delivery-job.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

@Injectable()
export class WebhookMessageService {
  constructor(
    private readonly messageRepository: WebhookMessageRepository,
    private readonly configRepository: WebhookConfigurationRepository,
    @InjectQueue('webhook-outbound-delivery')
    private readonly deliveryQueue: Queue<OutboundDeliveryJob>,
  ) {}

  async findAll(
    clientId: string,
    query: QueryWebhookMessageDto,
  ): Promise<{ data: WebhookMessage[]; total: number; page: number; pageSize: number }> {
    const [data, total] = await this.messageRepository.findByFilters(clientId, query);
    return {
      data,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    };
  }

  async findOne(id: string, clientId: string): Promise<WebhookMessage> {
    const message = await this.messageRepository.findById(id);
    if (!message || message.clientId !== clientId) {
      throw new CustomHttpException(
        'Webhook message not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.WEBHOOK_MESSAGE_NOT_FOUND,
      );
    }
    return message;
  }

  async reprocess(
    clientId: string,
    dto: ReprocessWebhookMessagesDto,
  ): Promise<{ queued: number }> {
    let messages: WebhookMessage[] = [];

    if (dto.ids && dto.ids.length > 0) {
      messages = await this.messageRepository.findFailedByIds(dto.ids, clientId);
    } else if (dto.configurationId) {
      messages = await this.messageRepository.findFailedByConfigurationId(
        dto.configurationId,
        clientId,
      );
    }

    let queued = 0;
    for (const message of messages) {
      const config = await this.configRepository.findByIdWithPrivateKey(
        message.configurationId,
      );
      if (!config) continue;

      await this.messageRepository.updateStatus(
        message.id,
        OutboundWebhookMessageStatus.PENDING,
        { attemptCount: 0, lastError: null, lastAttemptedAt: null },
      );

      await this.deliveryQueue.add(
        {
          webhookMessageId: message.id,
          configurationId: config.id,
          clientId: config.clientId,
          url: config.url,
          publicKey: config.publicKey,
          privateKey: config.privateKey,
          payload: message.payload,
          eventType: message.eventType,
          attemptNumber: 1,
        },
        { jobId: `reprocess-${message.id}-${Date.now()}` },
      );
      queued++;
    }

    return { queued };
  }
}
