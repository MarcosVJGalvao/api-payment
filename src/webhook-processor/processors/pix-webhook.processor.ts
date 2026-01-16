import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PixWebhookService } from '../services/pix-webhook.service';
import { WebhookEventLogService } from '../services/webhook-event-log.service';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import {
  PixCashInReceivedData,
  PixCashInClearedData,
  PixCashOutData,
  PixRefundData,
} from '../interfaces/pix-webhook.interface';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';
import { WebhookEvent } from '../enums/webhook-event.enum';

/**
 * Tipos de eventos de webhook de PIX.
 */
export type PixWebhookEventType =
  | 'CASH_IN_RECEIVED'
  | 'CASH_IN_CLEARED'
  | 'CASH_OUT_COMPLETED'
  | 'CASH_OUT_CANCELED'
  | 'CASH_OUT_UNDONE'
  | 'REFUND_RECEIVED'
  | 'REFUND_CLEARED';

/**
 * Estrutura do Job na fila de webhook de PIX.
 */
export interface PixWebhookJob {
  eventType: PixWebhookEventType;
  events:
    | WebhookPayload<PixCashInReceivedData>[]
    | WebhookPayload<PixCashInClearedData>[]
    | WebhookPayload<PixCashOutData>[]
    | WebhookPayload<PixRefundData>[];
  clientId: string;
  validPublicKey: boolean;
}

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
    const { eventType, events, clientId, validPublicKey } = job.data;

    this.logger.log(
      `Processing ${eventType} webhook job (ID: ${job.id}, Attempt: ${job.attemptsMade + 1})`,
    );

    try {
      switch (eventType) {
        case 'CASH_IN_RECEIVED':
          await this.pixWebhookService.handleCashInReceived(
            events as WebhookPayload<PixCashInReceivedData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_IN_CLEARED':
          await this.pixWebhookService.handleCashInCleared(
            events as WebhookPayload<PixCashInClearedData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_OUT_COMPLETED':
          await this.pixWebhookService.handleCashOutCompleted(
            events as WebhookPayload<PixCashOutData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_OUT_CANCELED':
          await this.pixWebhookService.handleCashOutCanceled(
            events as WebhookPayload<PixCashOutData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_OUT_UNDONE':
          await this.pixWebhookService.handleCashOutUndone(
            events as WebhookPayload<PixCashOutData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'REFUND_RECEIVED':
          await this.pixWebhookService.handleRefundReceived(
            events as WebhookPayload<PixRefundData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'REFUND_CLEARED':
          await this.pixWebhookService.handleRefundCleared(
            events as WebhookPayload<PixRefundData>[],
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
        `Error processing ${eventType} webhook: ${error instanceof Error ? error.message : String(error)}`,
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
      };

      const entityTypeMap: Record<string, string> = {
        CASH_IN_RECEIVED: 'PIX_CASH_IN',
        CASH_IN_CLEARED: 'PIX_CASH_IN',
        CASH_OUT_COMPLETED: 'PIX_TRANSFER',
        CASH_OUT_CANCELED: 'PIX_TRANSFER',
        CASH_OUT_UNDONE: 'PIX_TRANSFER',
        REFUND_RECEIVED: 'PIX_REFUND',
        REFUND_CLEARED: 'PIX_REFUND',
      };

      for (const event of events) {
        const data = event.data as { authenticationCode: string };
        try {
          await this.webhookEventLogService.logEvent({
            authenticationCode: data.authenticationCode,
            entityType: entityTypeMap[eventType],
            entityId: undefined,
            eventName: eventNameMap[eventType],
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
