import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { TedWebhookService } from '../services/ted-webhook.service';
import { WebhookEventLogService } from '../services/webhook-event-log.service';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import {
  TedCashOutData,
  TedCashInData,
  TedRefundData,
} from '../interfaces/ted-webhook.interface';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';
import { WebhookEvent } from '../enums/webhook-event.enum';
import { parseDate } from '@/common/helpers/date.helpers';

export type TedWebhookEventType =
  | 'CASH_OUT_APPROVED'
  | 'CASH_OUT_DONE'
  | 'CASH_OUT_CANCELED'
  | 'CASH_OUT_REPROVED'
  | 'CASH_OUT_UNDONE'
  | 'CASH_IN_RECEIVED'
  | 'CASH_IN_CLEARED'
  | 'REFUND_RECEIVED'
  | 'REFUND_CLEARED';

export interface TedWebhookJob {
  eventType: TedWebhookEventType;
  events:
    | WebhookPayload<TedCashOutData>[]
    | WebhookPayload<TedCashInData>[]
    | WebhookPayload<TedRefundData>[];
  clientId: string;
  validPublicKey: boolean;
}

@Processor('webhook-ted')
export class TedWebhookProcessor {
  private readonly logger = new Logger(TedWebhookProcessor.name);

  constructor(
    private readonly tedWebhookService: TedWebhookService,
    private readonly webhookEventLogService: WebhookEventLogService,
  ) {}

  @Process()
  async handleJob(job: Job<TedWebhookJob>): Promise<void> {
    const { eventType, events, clientId, validPublicKey } = job.data;

    this.logger.log(
      `Processing ${eventType} webhook job (ID: ${job.id}, Attempt: ${job.attemptsMade + 1})`,
    );

    try {
      switch (eventType) {
        // Cash-Out events
        case 'CASH_OUT_APPROVED':
          await this.tedWebhookService.handleCashOutApproved(
            events as WebhookPayload<TedCashOutData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_OUT_DONE':
          await this.tedWebhookService.handleCashOutDone(
            events as WebhookPayload<TedCashOutData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_OUT_CANCELED':
          await this.tedWebhookService.handleCashOutCanceled(
            events as WebhookPayload<TedCashOutData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_OUT_REPROVED':
          await this.tedWebhookService.handleCashOutReproved(
            events as WebhookPayload<TedCashOutData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_OUT_UNDONE':
          await this.tedWebhookService.handleCashOutUndone(
            events as WebhookPayload<TedCashOutData>[],
            clientId,
            validPublicKey,
          );
          break;
        // Cash-In events
        case 'CASH_IN_RECEIVED':
          await this.tedWebhookService.handleCashInReceived(
            events as WebhookPayload<TedCashInData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'CASH_IN_CLEARED':
          await this.tedWebhookService.handleCashInCleared(
            events as WebhookPayload<TedCashInData>[],
            clientId,
            validPublicKey,
          );
          break;
        // Refund events
        case 'REFUND_RECEIVED':
          await this.tedWebhookService.handleRefundReceived(
            events as WebhookPayload<TedRefundData>[],
            clientId,
            validPublicKey,
          );
          break;
        case 'REFUND_CLEARED':
          await this.tedWebhookService.handleRefundCleared(
            events as WebhookPayload<TedRefundData>[],
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
          `Out of sequence for ${error.eventName}, will retry. (AuthCode: ${error.authenticationCode})`,
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
