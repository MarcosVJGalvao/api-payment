import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { BillPaymentWebhookService } from '../services/bill-payment-webhook.service';
import { WebhookEventLogService } from '../services/webhook-event-log.service';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BillPaymentWebhookData } from '../interfaces/bill-payment-webhook.interface';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';
import { WebhookEvent } from '../enums/webhook-event.enum';

/**
 * Tipos de eventos de webhook de pagamento de contas.
 */
export type BillPaymentWebhookEventType =
  | 'RECEIVED'
  | 'CREATED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUSED';

/**
 * Estrutura do Job na fila de webhook de pagamento.
 */
export interface BillPaymentWebhookJob {
  eventType: BillPaymentWebhookEventType;
  events: WebhookPayload<BillPaymentWebhookData>[];
  clientId: string;
  validPublicKey: boolean;
}

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
    const { eventType, events, clientId, validPublicKey } = job.data;

    this.logger.log(
      `Processing ${eventType} webhook job (ID: ${job.id}, Attempt: ${job.attemptsMade + 1})`,
    );

    try {
      switch (eventType) {
        case 'RECEIVED':
          await this.billPaymentWebhookService.handleReceived(
            events,
            clientId,
            validPublicKey,
          );
          break;
        case 'CREATED':
          await this.billPaymentWebhookService.handleCreated(
            events,
            clientId,
            validPublicKey,
          );
          break;
        case 'CONFIRMED':
          await this.billPaymentWebhookService.handleConfirmed(
            events,
            clientId,
            validPublicKey,
          );
          break;
        case 'FAILED':
          await this.billPaymentWebhookService.handleFailed(
            events,
            clientId,
            validPublicKey,
          );
          break;
        case 'CANCELLED':
          await this.billPaymentWebhookService.handleCancelled(
            events,
            clientId,
            validPublicKey,
          );
          break;
        case 'REFUSED':
          await this.billPaymentWebhookService.handleRefused(
            events,
            clientId,
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
      for (const event of events) {
        const data = event.data;
        try {
          await this.webhookEventLogService.logEvent({
            authenticationCode: data.authenticationCode,
            entityType: 'BILL_PAYMENT',
            entityId: undefined,
            eventName: `BILL_PAYMENT_WAS_${eventType}` as WebhookEvent,
            wasProcessed: false,
            skipReason: `Failed after ${maxAttempts} attempts: ${error.message}`,
            payload: event as unknown as Record<string, unknown>,
            providerTimestamp: new Date(event.timestamp),
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
