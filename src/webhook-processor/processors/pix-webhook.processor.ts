import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PixWebhookService } from '../services/pix-webhook.service';
import { toPayload } from '../helpers/payload.helper';
import { WebhookEventLogService } from '../services/webhook-event-log.service';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';
import { WebhookEvent } from '../enums/webhook-event.enum';
import { parseDate } from '@/common/helpers/date.helpers';
import { isRecord } from '@/common/errors/helpers/type.helpers';
import { PixWebhookEventType } from '../enums/pix-webhook-event-type.enum';
import type { PixWebhookJob } from '../interfaces/pix-webhook-job.type';
import { getErrorMessage } from '@/common/helpers/exception.helper';

function getAuthenticationCode(data: unknown): string | undefined {
  if (!isRecord(data)) {
    return undefined;
  }

  const value = data['authenticationCode'];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Tipos de eventos de webhook de PIX.
 */
// Mantido fora do processor: enums/job types estão em `enums/` e `interfaces/`.

/**
 * Processor responsável por consumir jobs da fila 'webhook-pix'.
 * Delega o processamento para o PixWebhookService existente.
 */
@Processor('webhook-pix')
export class PixWebhookProcessor {
  private readonly logger = new Logger(PixWebhookProcessor.name);

  constructor(
    private readonly pixWebhookService: PixWebhookService,
    private readonly webhookEventLogService: WebhookEventLogService,
  ) {}

  @Process()
  async handleJob(job: Job<PixWebhookJob>): Promise<void> {
    const data = job.data;

    this.logger.log(
      `Processing ${data.eventType} webhook job (ID: ${job.id}, Attempt: ${job.attemptsMade + 1})`,
    );

    try {
      switch (data.eventType) {
        case PixWebhookEventType.CASH_IN_RECEIVED:
          await this.pixWebhookService.handleCashInReceived(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case PixWebhookEventType.CASH_IN_CLEARED:
          await this.pixWebhookService.handleCashInCleared(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case PixWebhookEventType.CASH_OUT_COMPLETED:
          await this.pixWebhookService.handleCashOutCompleted(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case PixWebhookEventType.CASH_OUT_CANCELED:
          await this.pixWebhookService.handleCashOutCanceled(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case PixWebhookEventType.CASH_OUT_UNDONE:
          await this.pixWebhookService.handleCashOutUndone(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case PixWebhookEventType.REFUND_RECEIVED:
          await this.pixWebhookService.handleRefundReceived(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case PixWebhookEventType.REFUND_CLEARED:
          await this.pixWebhookService.handleRefundCleared(
            data.events,
            data.clientId,
            data.providerSlug,
            data.validPublicKey,
          );
          break;
        case PixWebhookEventType.QRCODE_CREATED:
          await this.pixWebhookService.handleQrCodeCreated(
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
          `Out of sequence for ${error.eventName}, will retry. (AuthCode: ${error.authenticationCode}, Reason: ${error.reason})`,
        );
        throw error;
      }

      this.logger.error(
        `Error processing ${data.eventType} webhook: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job<PixWebhookJob>, error: Error): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 5;
    const isLastAttempt = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Job ${job.id} (${job.data.eventType}) failed attempt ${job.attemptsMade}/${maxAttempts}: ${error.message}`,
      error.stack,
    );

    // Log final failure to webhook_event_log
    if (isLastAttempt) {
      const { events, clientId, eventType } = job.data;
      const eventNameMap: Record<string, WebhookEvent> = {
        CASH_IN_RECEIVED: WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,
        CASH_IN_CLEARED: WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
        CASH_OUT_COMPLETED: WebhookEvent.PIX_CASHOUT_WAS_COMPLETED,
        CASH_OUT_CANCELED: WebhookEvent.PIX_CASHOUT_WAS_CANCELED,
        CASH_OUT_UNDONE: WebhookEvent.PIX_CASHOUT_WAS_UNDONE,
        REFUND_RECEIVED: WebhookEvent.PIX_REFUND_WAS_RECEIVED,
        REFUND_CLEARED: WebhookEvent.PIX_REFUND_WAS_CLEARED,
        QRCODE_CREATED: WebhookEvent.PIX_QRCODE_WAS_CREATED,
      };

      const entityTypeMap: Record<string, string> = {
        CASH_IN_RECEIVED: 'PIX_CASH_IN',
        CASH_IN_CLEARED: 'PIX_CASH_IN',
        CASH_OUT_COMPLETED: 'PIX_TRANSFER',
        CASH_OUT_CANCELED: 'PIX_TRANSFER',
        CASH_OUT_UNDONE: 'PIX_TRANSFER',
        REFUND_RECEIVED: 'PIX_REFUND',
        REFUND_CLEARED: 'PIX_REFUND',
        QRCODE_CREATED: 'PIX_QR_CODE',
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
