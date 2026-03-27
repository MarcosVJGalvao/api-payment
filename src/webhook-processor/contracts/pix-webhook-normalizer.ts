import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import {
  PixCashInReceivedData,
  PixCashInClearedData,
  PixCashOutData,
  PixRefundData,
  PixQrCodeCreatedData,
} from '../interfaces/pix-webhook.interface';

export interface PixWebhookNormalizer {
  readonly providerSlug: FinancialProvider;

  normalizeCashInReceived(
    events: WebhookPayload<PixCashInReceivedData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<PixCashInReceivedData>[];

  normalizeCashInCleared(
    events: WebhookPayload<PixCashInClearedData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<PixCashInClearedData>[];

  normalizeCashOutCompleted(
    events: WebhookPayload<PixCashOutData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<PixCashOutData>[];

  normalizeCashOutCanceled(
    events: WebhookPayload<PixCashOutData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<PixCashOutData>[];

  normalizeCashOutUndone(
    events: WebhookPayload<PixCashOutData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<PixCashOutData>[];

  normalizeRefundReceived(
    events: WebhookPayload<PixRefundData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<PixRefundData>[];

  normalizeRefundCleared(
    events: WebhookPayload<PixRefundData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<PixRefundData>[];

  normalizeQrCodeCreated(
    events: WebhookPayload<PixQrCodeCreatedData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<PixQrCodeCreatedData>[];
}
