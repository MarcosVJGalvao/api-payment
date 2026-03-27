import type { WebhookPayload } from './webhook-base.interface';
import type { BillPaymentWebhookData } from './bill-payment-webhook.interface';
import type { BillPaymentWebhookEventType } from '../enums/bill-payment-webhook-event-type.enum';

export interface BillPaymentWebhookJob {
  eventType: BillPaymentWebhookEventType;
  events: WebhookPayload<BillPaymentWebhookData>[];
  clientId: string;
  providerSlug: string;
  validPublicKey: boolean;
}
