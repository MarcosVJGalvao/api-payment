import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import {
  TedCashOutData,
  TedCashInData,
  TedRefundData,
} from '../interfaces/ted-webhook.interface';

export interface TedWebhookNormalizer {
  readonly providerSlug: FinancialProvider;

  normalizeCashOutApproved(
    events: WebhookPayload<TedCashOutData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[];

  normalizeCashOutDone(
    events: WebhookPayload<TedCashOutData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[];

  normalizeCashOutCanceled(
    events: WebhookPayload<TedCashOutData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[];

  normalizeCashOutReproved(
    events: WebhookPayload<TedCashOutData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[];

  normalizeCashOutUndone(
    events: WebhookPayload<TedCashOutData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[];

  normalizeCashInReceived(
    events: WebhookPayload<TedCashInData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedCashInData>[];

  normalizeCashInCleared(
    events: WebhookPayload<TedCashInData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedCashInData>[];

  normalizeRefundReceived(
    events: WebhookPayload<TedRefundData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedRefundData>[];

  normalizeRefundCleared(
    events: WebhookPayload<TedRefundData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<TedRefundData>[];
}
