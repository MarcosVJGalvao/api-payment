import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { BillPaymentWebhookService } from '../services/bill-payment-webhook.service';
import { toPayload } from '../helpers/payload.helper';
import { WebhookEventLogService } from '../services/webhook-event-log.service';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';
import { WebhookEvent } from '../enums/webhook-event.enum';
import { parseDate } from '@/common/helpers/date.helpers';
import { BillPaymentWebhookEventType } from '../enums/bill-payment-webhook-event-type.enum';
import type { BillPaymentWebhookJob } from '../interfaces/bill-payment-webhook-job.interface';

/**
 * Processor responsável por consumir jobs da fila 'webhook-bill-payment'.
 * Delega o processamento para o BillPaymentWebhookService existente.
 */
@Processor('webhook-bill-payment')
export class BillPaymentWebhookProcessor {
  private readonly logger = new Logger(BillPaymentWebhookProcessor.name);

  constructor(
    private readonly billPaymentWebhookService: BillPaymentWebhookService,
    private readonly webhookEventLogService: WebhookEventLogService,
  ) {}

  @Process()
  async handleJob(job: Job<BillPaymentWebhookJob>): Promise<void> {
    const { eventType, events, clientId, providerSlug, validPublicKey } =
      job.data;

    this.logger.log(
      `Processing ${eventType} webhook job (ID: ${job.id}, Attempt: ${job.attemptsMade + 1})`,
    );

    try {
      switch (eventType) {
        case BillPaymentWebhookEventType.RECEIVED:
          await this.billPaymentWebhookService.handleReceived(
            events,
            clientId,
            providerSlug,
            validPublicKey,
          );
          break;
        case BillPaymentWebhookEventType.CREATED:
          await this.billPaymentWebhookService.handleCreated(
            events,
            clientId,
            providerSlug,
            validPublicKey,
          );
          break;
        case BillPaymentWebhookEventType.CONFIRMED:
          await this.billPaymentWebhookService.handleConfirmed(
            events,
            clientId,
            providerSlug,
            validPublicKey,
          );
          break;
        case BillPaymentWebhookEventType.FAILED:
          await this.billPaymentWebhookService.handleFailed(
            events,
            clientId,
            providerSlug,
            validPublicKey,
          );
          break;
        case BillPaymentWebhookEventType.CANCELLED:
          await this.billPaymentWebhookService.handleCancelled(
            events,
            clientId,
            providerSlug,
            validPublicKey,
          );
          break;
        case BillPaymentWebhookEventType.REFUSED:
          await this.billPaymentWebhookService.handleRefused(
            events,
            clientId,
            providerSlug,
            validPublicKey,
          );
          break;
        default:
          this.logger.warn(`Unknown event type: ${String(eventType)}`);
      }

      this.logger.log(
        `Successfully processed ${eventType} webhook job (ID: ${job.id})`,
      );
    } catch (error) {
      // Se for erro de transação não encontrada, relançar para retry
      if (error instanceof TransactionNotFoundRetryableException) {
        this.logger.warn(
          `Transaction not found for ${error.eventName}, will retry. (AuthCode: ${error.authenticationCode})`,
        );
        throw error;
      }

      // Se for erro de sequência (evento anterior não processado), relançar para retry
      if (error instanceof WebhookOutOfSequenceRetryableException) {
        this.logger.warn(
          `Out of sequence for ${error.eventName}, will retry. (AuthCode: ${error.authenticationCode}, Reason: ${error.reason})`,
        );
        throw error;
      }

      // Para outros erros, logar e re-lançar
      this.logger.error(
        `Error processing ${eventType} webhook: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job<BillPaymentWebhookJob>, error: Error): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 5;
    const isLastAttempt = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Job ${job.id} (${job.data.eventType}) failed attempt ${job.attemptsMade}/${maxAttempts}: ${error.message}`,
      error.stack,
    );

    // Log final failure to webhook_event_log
    if (isLastAttempt) {
      const { events, clientId, eventType } = job.data;
      const eventNameMap: Record<BillPaymentWebhookEventType, WebhookEvent> = {
        RECEIVED: WebhookEvent.BILL_PAYMENT_WAS_RECEIVED,
        CREATED: WebhookEvent.BILL_PAYMENT_WAS_CREATED,
        CONFIRMED: WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED,
        FAILED: WebhookEvent.BILL_PAYMENT_HAS_FAILED,
        CANCELLED: WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,
        REFUSED: WebhookEvent.BILL_PAYMENT_WAS_REFUSED,
      };
      for (const event of events) {
        const data = event.data;
        try {
          await this.webhookEventLogService.logEvent({
            authenticationCode: data.authenticationCode,
            entityType: 'BILL_PAYMENT',
            entityId: undefined,
            eventName: eventNameMap[eventType],
            wasProcessed: false,
            skipReason: `Failed after ${maxAttempts} attempts: ${error.message}`,
            payload: toPayload(event),
            providerTimestamp: parseDate(event.timestamp),
            clientId,
          });
          this.logger.log(
            `Logged failed webhook to event log: ${data.authenticationCode}`,
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
