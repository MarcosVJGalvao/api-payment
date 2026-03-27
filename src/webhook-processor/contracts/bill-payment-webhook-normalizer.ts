import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BillPaymentWebhookData } from '../interfaces/bill-payment-webhook.interface';

export interface BillPaymentWebhookNormalizer {
  readonly providerSlug: FinancialProvider;

  normalizeReceived(
    events: WebhookPayload<BillPaymentWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[];

  normalizeCreated(
    events: WebhookPayload<BillPaymentWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[];

  normalizeConfirmed(
    events: WebhookPayload<BillPaymentWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[];

  normalizeFailed(
    events: WebhookPayload<BillPaymentWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[];

  normalizeCancelled(
    events: WebhookPayload<BillPaymentWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[];

  normalizeRefused(
    events: WebhookPayload<BillPaymentWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BillPaymentWebhookData>[];
}
