import type { WebhookPayload } from './webhook-base.interface';
import type { BoletoWebhookData } from './boleto-webhook.interface';
import type { BoletoWebhookEventType } from '../enums/boleto-webhook-event-type.enum';

export interface BoletoWebhookJob {
  eventType: BoletoWebhookEventType;
  events: WebhookPayload<BoletoWebhookData>[];
  clientId: string;
  providerSlug: string;
  validPublicKey: boolean;
}
