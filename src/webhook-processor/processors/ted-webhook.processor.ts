import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { TedWebhookService } from '../services/ted-webhook.service';
import { toPayload } from '../helpers/payload.helper';
import { WebhookEventLogService } from '../services/webhook-event-log.service';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';
import { WebhookEvent } from '../enums/webhook-event.enum';
import { parseDate } from '@/common/helpers/date.helpers';
import { isRecord } from '@/common/errors/helpers/type.helpers';
import { TedWebhookEventType } from '../enums/ted-webhook-event-type.enum';
import type { TedWebhookJob } from '../interfaces/ted-webhook-job.type';

function getAuthenticationCode(data: unknown): string | undefined {
  if (!isRecord(data)) {
    return undefined;
  }

  const value = data['authenticationCode'];
  return typeof value === 'string' ? value : undefined;
}

// Mantido fora do processor: enums/job types estão em `enums/` e `interfaces/`.

@Processor('webhook-ted')
export class TedWebhookProcessor {
  private readonly logger = new Logger(TedWebhookProcessor.name);

  constructor(
    private readonly tedWebhookService: TedWebhookService,
    private readonly webhookEventLogService: WebhookEventLogService,
  ) {}

  @Process()
  async handleJob(job: Job<TedWebhookJob>): Promise<void> {
    const data = job.data;

    this.logger.log(
      `Processing ${data.eventType} webhook job (ID: ${job.id}, Attempt: ${job.attemptsMade + 1})`,
    );

    try {
      switch (data.eventType) {
        // Cash-Out events
        case TedWebhookEventType.CASH_OUT_APPROVED:
          await this.tedWebhookService.handleCashOutApproved(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case TedWebhookEventType.CASH_OUT_DONE:
          await this.tedWebhookService.handleCashOutDone(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case TedWebhookEventType.CASH_OUT_CANCELED:
          await this.tedWebhookService.handleCashOutCanceled(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case TedWebhookEventType.CASH_OUT_REPROVED:
          await this.tedWebhookService.handleCashOutReproved(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case TedWebhookEventType.CASH_OUT_UNDONE:
          await this.tedWebhookService.handleCashOutUndone(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        // Cash-In events
        case TedWebhookEventType.CASH_IN_RECEIVED:
          await this.tedWebhookService.handleCashInReceived(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case TedWebhookEventType.CASH_IN_CLEARED:
          await this.tedWebhookService.handleCashInCleared(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        // Refund events
        case TedWebhookEventType.REFUND_RECEIVED:
          await this.tedWebhookService.handleRefundReceived(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case TedWebhookEventType.REFUND_CLEARED:
          await this.tedWebhookService.handleRefundCleared(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
      }

      this.logger.log(
        `Successfully processed ${data.eventType} webhook job (ID: ${job.id})`,
      );
    } catch (error) {
      if (error instanceof TransactionNotFoundRetryableException) {
        this.logger.warn(
          `Transaction not found for ${error.eventName}, will retry. (AuthCode: ${error.authenticationCode})`,
        );
        throw error;
      }

      if (error instanceof WebhookOutOfSequenceRetryableException) {
        this.logger.warn(
          `Out of sequence for ${error.eventName}, will retry. (AuthCode: ${error.authenticationCode})`,
        );
        throw error;
      }

      this.logger.error(
        `Error processing ${data.eventType} webhook: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job<TedWebhookJob>, error: Error): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 5;
    const isLastAttempt = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Job ${job.id} (${job.data.eventType}) failed attempt ${job.attemptsMade}/${maxAttempts}: ${error.message}`,
      error.stack,
    );

    if (isLastAttempt) {
      const { events, clientId, eventType } = job.data;
      const eventNameMap: Record<string, WebhookEvent> = {
        CASH_OUT_APPROVED: WebhookEvent.TED_CASH_OUT_WAS_APPROVED,
        CASH_OUT_DONE: WebhookEvent.TED_CASH_OUT_WAS_DONE,
        CASH_OUT_CANCELED: WebhookEvent.TED_CASH_OUT_WAS_CANCELED,
        CASH_OUT_REPROVED: WebhookEvent.TED_CASH_OUT_WAS_REPROVED,
        CASH_OUT_UNDONE: WebhookEvent.TED_CASH_OUT_WAS_UNDONE,
        CASH_IN_RECEIVED: WebhookEvent.TED_CASH_IN_WAS_RECEIVED,
        CASH_IN_CLEARED: WebhookEvent.TED_CASH_IN_WAS_CLEARED,
        REFUND_RECEIVED: WebhookEvent.TED_REFUND_WAS_RECEIVED,
        REFUND_CLEARED: WebhookEvent.TED_REFUND_WAS_CLEARED,
      };

      const entityTypeMap: Record<string, string> = {
        CASH_OUT_APPROVED: 'TED_TRANSFER',
        CASH_OUT_DONE: 'TED_TRANSFER',
        CASH_OUT_CANCELED: 'TED_TRANSFER',
        CASH_OUT_REPROVED: 'TED_TRANSFER',
        CASH_OUT_UNDONE: 'TED_TRANSFER',
        CASH_IN_RECEIVED: 'TED_CASH_IN',
        CASH_IN_CLEARED: 'TED_CASH_IN',
        REFUND_RECEIVED: 'TED_REFUND',
        REFUND_CLEARED: 'TED_REFUND',
      };

      for (const event of events) {
        const authenticationCode = getAuthenticationCode(event.data);
        try {
          if (!authenticationCode) {
            this.logger.warn(
              `Missing authenticationCode in failed webhook payload for event ${eventType}`,
            );
            continue;
          }
          await this.webhookEventLogService.logEvent({
            authenticationCode,
            entityType: entityTypeMap[eventType],
            entityId: undefined,
            eventName: eventNameMap[eventType],
            wasProcessed: false,
            skipReason: `Failed after ${maxAttempts} attempts: ${error.message}`,
            payload: toPayload(event),
            providerTimestamp: parseDate(event.timestamp),
            clientId,
          });
          this.logger.log(
            `Logged failed webhook to event log: ${authenticationCode}`,
          );
        } catch (logError) {
          this.logger.error(
            `Failed to log webhook failure: ${logError instanceof Error ? logError.message : String(logError)}`,
          );
        }
      }
    }
  }
}
