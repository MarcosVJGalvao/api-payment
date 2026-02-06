import type { WebhookPayload } from './webhook-base.interface';
import type {
  PixCashInReceivedData,
  PixCashInClearedData,
  PixCashOutData,
  PixRefundData,
  PixQrCodeCreatedData,
} from './pix-webhook.interface';
import type { PixWebhookEventType } from '../enums/pix-webhook-event-type.enum';

export type PixWebhookJob =
  | {
      eventType: PixWebhookEventType.CASH_IN_RECEIVED;
      events: WebhookPayload<PixCashInReceivedData>[];
      clientId: string;
      providerSlug: string;
      validPublicKey: boolean;
    }
  | {
      eventType: PixWebhookEventType.CASH_IN_CLEARED;
      events: WebhookPayload<PixCashInClearedData>[];
      clientId: string;
      providerSlug: string;
      validPublicKey: boolean;
    }
  | {
      eventType:
        | PixWebhookEventType.CASH_OUT_COMPLETED
        | PixWebhookEventType.CASH_OUT_CANCELED
        | PixWebhookEventType.CASH_OUT_UNDONE;
      events: WebhookPayload<PixCashOutData>[];
      clientId: string;
      providerSlug: string;
      validPublicKey: boolean;
    }
  | {
      eventType:
        | PixWebhookEventType.REFUND_RECEIVED
        | PixWebhookEventType.REFUND_CLEARED;
      events: WebhookPayload<PixRefundData>[];
      clientId: string;
      providerSlug: string;
      validPublicKey: boolean;
    }
  | {
      eventType: PixWebhookEventType.QRCODE_CREATED;
      events: WebhookPayload<PixQrCodeCreatedData>[];
      clientId: string;
      providerSlug: string;
      validPublicKey: boolean;
    };
