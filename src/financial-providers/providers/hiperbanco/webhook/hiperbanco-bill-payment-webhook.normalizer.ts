import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { BillPaymentWebhookNormalizer } from '@/webhook-processor/contracts/bill-payment-webhook-normalizer';
import { WebhookPayload } from '@/webhook-processor/interfaces/webhook-base.interface';
import { BillPaymentWebhookData } from '@/webhook-processor/interfaces/bill-payment-webhook.interface';

@Injectable()
export class HiperbancoBillPaymentWebhookNormalizer
  implements BillPaymentWebhookNormalizer
{
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  normalizeReceived(
    events: WebhookPayload<BillPaymentWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[] {
    return events;
  }

  normalizeCreated(
    events: WebhookPayload<BillPaymentWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[] {
    return events;
  }

  normalizeConfirmed(
    events: WebhookPayload<BillPaymentWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[] {
    return events;
  }

  normalizeFailed(
    events: WebhookPayload<BillPaymentWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[] {
    return events;
  }

  normalizeCancelled(
    events: WebhookPayload<BillPaymentWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[] {
    return events;
  }

  normalizeRefused(
    events: WebhookPayload<BillPaymentWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[] {
    return events;
  }
}
