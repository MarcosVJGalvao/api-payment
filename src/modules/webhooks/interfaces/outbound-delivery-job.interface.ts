import type { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';
import type { OutboundWebhookPayload } from './outbound-webhook-payload.interface';

export interface OutboundDeliveryJob {
  webhookMessageId: string;
  configurationId: string;
  clientId: string;
  url: string;
  publicKey: string;
  privateKey: string;
  payload: OutboundWebhookPayload[];
  eventType: ApiPaymentWebhookEventType;
  attemptNumber: number;
}
