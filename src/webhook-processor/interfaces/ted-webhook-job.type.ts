import type { WebhookPayload } from './webhook-base.interface';
import type {
  TedCashOutData,
  TedCashInData,
  TedRefundData,
} from './ted-webhook.interface';
import type { TedWebhookEventType } from '../enums/ted-webhook-event-type.enum';

export type TedWebhookJob =
  | {
      eventType:
        | TedWebhookEventType.CASH_OUT_APPROVED
        | TedWebhookEventType.CASH_OUT_DONE
        | TedWebhookEventType.CASH_OUT_CANCELED
        | TedWebhookEventType.CASH_OUT_REPROVED
        | TedWebhookEventType.CASH_OUT_UNDONE;
      events: WebhookPayload<TedCashOutData>[];
      clientId: string;
      providerSlug: string;
      validPublicKey: boolean;
    }
  | {
      eventType:
        | TedWebhookEventType.CASH_IN_RECEIVED
        | TedWebhookEventType.CASH_IN_CLEARED;
      events: WebhookPayload<TedCashInData>[];
      clientId: string;
      providerSlug: string;
      validPublicKey: boolean;
    }
  | {
      eventType:
        | TedWebhookEventType.REFUND_RECEIVED
        | TedWebhookEventType.REFUND_CLEARED;
      events: WebhookPayload<TedRefundData>[];
      clientId: string;
      providerSlug: string;
      validPublicKey: boolean;
    };
