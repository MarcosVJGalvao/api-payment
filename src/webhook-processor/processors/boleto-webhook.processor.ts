import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { BoletoWebhookService } from '../services/boleto-webhook.service';
import { WebhookEventLogService } from '../services/webhook-event-log.service';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BoletoWebhookData } from '../interfaces/boleto-webhook.interface';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';
import { WebhookEvent } from '../enums/webhook-event.enum';
import { parseDate } from '@/common/helpers/date.helpers';

/**
 * Tipos de eventos de webhook de boleto.
 */
export type BoletoWebhookEventType =
  | 'REGISTERED'
  | 'CASH_IN_RECEIVED'
  | 'CASH_IN_CLEARED'
  | 'CANCELLED';

/**
 * Estrutura do Job na fila de webhook de boleto.
 */
export interface BoletoWebhookJob {
  eventType: BoletoWebhookEventType;
  events: WebhookPayload<BoletoWebhookData>[];
  clientId: string;
  validPublicKey: boolean;
}

/**
 * Processor responsável por consumir jobs da fila 'webhook-boleto'.
 * Delega o processamento para o BoletoWebhookService existente.
 */
@Processor('webhook-boleto')
export class BoletoWebhookProcessor {
  private readonly logger = new Logger(BoletoWebhookProcessor.name);

  constructor(
    private readonly boletoWebhookService: BoletoWebhookService,
    private readonly webhookEventLogService: WebhookEventLogService,
  ) {}

  @Process()
  async handleJob(job: Job<BoletoWebhookJob>): Promise<void> {
    const { eventType, events, clientId, validPublicKey } = job.data;

    this.logger.log(
      `Processing ${eventType} webhook job (ID: ${job.id}, Attempt: ${job.attemptsMade + 1})`,
    );

    try {
      switch (eventType) {
        case 'REGISTERED':
          await this.boletoWebhookService.handleRegistered(
            events,
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_IN_RECEIVED':
          await this.boletoWebhookService.handleCashInReceived(
            events,
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_IN_CLEARED':
          await this.boletoWebhookService.handleCashInCleared(
            events,
            clientId,
            validPublicKey,
          );
          break;
        case 'CANCELLED':
          await this.boletoWebhookService.handleCancelled(
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
  async onFailed(job: Job<BoletoWebhookJob>, error: Error): Promise<void> {
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
        REGISTERED: WebhookEvent.BOLETO_WAS_REGISTERED,
        CASH_IN_RECEIVED: WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED,
        CASH_IN_CLEARED: WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED,
        CANCELLED: WebhookEvent.BOLETO_WAS_CANCELLED,
      };
      for (const event of events) {
        const data = event.data;
        try {
          await this.webhookEventLogService.logEvent({
            authenticationCode: data.authenticationCode,
            entityType: 'BOLETO',
            entityId: undefined,
            eventName: eventNameMap[eventType],
            wasProcessed: false,
            skipReason: `Failed after ${maxAttempts} attempts: ${error.message}`,
            payload: event as unknown as Record<string, unknown>,
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
