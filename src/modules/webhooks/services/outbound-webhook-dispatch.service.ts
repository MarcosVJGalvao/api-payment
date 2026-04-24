import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { WebhookConfigurationRepository } from '../repositories/webhook-configuration.repository';
import { WebhookMessageRepository } from '../repositories/webhook-message.repository';
import { PROVIDER_EVENT_TO_API_EVENT } from '../maps/provider-event-to-api-event.map';
import { OutboundWebhookMessageStatus } from '../enums/outbound-webhook-message-status.enum';
import type { DispatchTriggerInput } from '../interfaces/dispatch-trigger-input.interface';
import type { OutboundDeliveryJob } from '../interfaces/outbound-delivery-job.interface';
import type { OutboundWebhookPayload } from '../interfaces/outbound-webhook-payload.interface';
import type { WebhookPayload } from '@/webhook-processor/interfaces/webhook-base.interface';
import { isRecord } from '@/common/errors/helpers/type.helpers';
import { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';
import { TransactionRepository } from '@/transaction/repositories/transaction.repository';

@Injectable()
export class OutboundWebhookDispatchService {
  private readonly logger = new Logger(OutboundWebhookDispatchService.name);

  constructor(
    private readonly configRepository: WebhookConfigurationRepository,
    private readonly messageRepository: WebhookMessageRepository,
    private readonly configService: ConfigService,
    private readonly transactionRepository: TransactionRepository,
    @InjectQueue('webhook-outbound-delivery')
    private readonly deliveryQueue: Queue<OutboundDeliveryJob>,
  ) {}

  async dispatch(input: DispatchTriggerInput): Promise<void> {
    const apiEventType = PROVIDER_EVENT_TO_API_EVENT[input.providerEventName];
    if (!apiEventType) {
      this.logger.warn(
        `No API event mapping for provider event: ${input.providerEventName}`,
      );
      return;
    }

    const clientId = input.clientId || await this.resolveClientIdFromEvents(input.events);
    if (!clientId) {
      this.logger.warn(
        `Could not resolve clientId for event: ${input.providerEventName}`,
      );
      return;
    }

    const configurations = await this.configRepository.findActiveForEvent(
      clientId,
      apiEventType,
    );

    if (configurations.length === 0) {
      return;
    }

    const environment = this.configService.get<string>(
      'OUTBOUND_WEBHOOK_ENVIRONMENT',
      'PRODUCTION',
    );

    const payload = this.buildPayload(input, clientId, apiEventType, environment);

    for (const config of configurations) {
      try {
        const message = await this.messageRepository.create({
          configurationId: config.id,
          clientId: config.clientId,
          eventType: apiEventType,
          providerEventName: input.providerEventName,
          providerSlug: input.providerSlug,
          payload,
          status: OutboundWebhookMessageStatus.PENDING,
          correlationId: input.correlationId ?? null,
        });

        await this.deliveryQueue.add(
          {
            webhookMessageId: message.id,
            configurationId: config.id,
            clientId: config.clientId,
            url: config.url,
            publicKey: config.publicKey,
            privateKey: config.privateKey,
            payload,
            eventType: apiEventType,
            attemptNumber: 1,
          },
          { jobId: message.id },
        );
      } catch (error) {
        this.logger.error(
          `Failed to create message/enqueue job for config ${config.id}: ${String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  private buildPayload(
    input: DispatchTriggerInput,
    clientId: string,
    apiEventType: ApiPaymentWebhookEventType,
    environment: string,
  ): OutboundWebhookPayload[] {
    return input.events.map((event: WebhookPayload<unknown>) => {
      const entityId = this.extractEntityId(event);
      return {
        entityId,
        companyKey: clientId,
        name: apiEventType,
        timestamp: new Date().toISOString(),
        correlationId: input.correlationId ?? randomUUID(),
        metadata: {
          clientId,
          provider: input.providerSlug.toUpperCase(),
          environment,
        },
        data: isRecord(event.data) ? event.data : {},
      };
    });
  }

  private extractEntityId(event: WebhookPayload<unknown>): string {
    if (event.entityId) return event.entityId;
    if (isRecord(event.data)) {
      const id = event.data['id'] ?? event.data['entityId'] ?? event.data['authenticationCode'];
      if (typeof id === 'string') return id;
    }
    return randomUUID();
  }

  private async resolveClientIdFromEvents(
    events: ReadonlyArray<WebhookPayload<unknown>>,
  ): Promise<string | undefined> {
    for (const event of events) {
      if (isRecord(event.data)) {
        const authCode = event.data['authenticationCode'];
        if (typeof authCode === 'string') {
          const transaction = await this.transactionRepository.findByAuthenticationCode(authCode);
          if (transaction?.clientId) return transaction.clientId;
        }
      }
    }
    return undefined;
  }
}
