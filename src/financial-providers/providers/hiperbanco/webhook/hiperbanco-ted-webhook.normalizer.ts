import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { TedWebhookNormalizer } from '@/webhook-processor/contracts/ted-webhook-normalizer';
import { WebhookPayload } from '@/webhook-processor/interfaces/webhook-base.interface';
import {
  TedCashOutData,
  TedCashInData,
  TedRefundData,
} from '@/webhook-processor/interfaces/ted-webhook.interface';

@Injectable()
export class HiperbancoTedWebhookNormalizer implements TedWebhookNormalizer {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  normalizeCashOutApproved(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return events;
  }

  normalizeCashOutDone(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return events;
  }

  normalizeCashOutCanceled(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return events;
  }

  normalizeCashOutReproved(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return events;
  }

  normalizeCashOutUndone(
    events: WebhookPayload<TedCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashOutData>[] {
    return events;
  }

  normalizeCashInReceived(
    events: WebhookPayload<TedCashInData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashInData>[] {
    return events;
  }

  normalizeCashInCleared(
    events: WebhookPayload<TedCashInData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedCashInData>[] {
    return events;
  }

  normalizeRefundReceived(
    events: WebhookPayload<TedRefundData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedRefundData>[] {
    return events;
  }

  normalizeRefundCleared(
    events: WebhookPayload<TedRefundData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<TedRefundData>[] {
    return events;
  }
}
