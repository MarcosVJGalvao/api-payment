import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { PixWebhookNormalizer } from '@/webhook-processor/contracts/pix-webhook-normalizer';
import { WebhookPayload } from '@/webhook-processor/interfaces/webhook-base.interface';
import {
  PixCashInReceivedData,
  PixCashInClearedData,
  PixCashOutData,
  PixRefundData,
  PixQrCodeCreatedData,
} from '@/webhook-processor/interfaces/pix-webhook.interface';

@Injectable()
export class HiperbancoPixWebhookNormalizer implements PixWebhookNormalizer {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  normalizeCashInReceived(
    events: WebhookPayload<PixCashInReceivedData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<PixCashInReceivedData>[] {
    return events;
  }

  normalizeCashInCleared(
    events: WebhookPayload<PixCashInClearedData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<PixCashInClearedData>[] {
    return events;
  }

  normalizeCashOutCompleted(
    events: WebhookPayload<PixCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<PixCashOutData>[] {
    return events;
  }

  normalizeCashOutCanceled(
    events: WebhookPayload<PixCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<PixCashOutData>[] {
    return events;
  }

  normalizeCashOutUndone(
    events: WebhookPayload<PixCashOutData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<PixCashOutData>[] {
    return events;
  }

  normalizeRefundReceived(
    events: WebhookPayload<PixRefundData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<PixRefundData>[] {
    return events;
  }

  normalizeRefundCleared(
    events: WebhookPayload<PixRefundData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<PixRefundData>[] {
    return events;
  }

  normalizeQrCodeCreated(
    events: WebhookPayload<PixQrCodeCreatedData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<PixQrCodeCreatedData>[] {
    return events;
  }
}
