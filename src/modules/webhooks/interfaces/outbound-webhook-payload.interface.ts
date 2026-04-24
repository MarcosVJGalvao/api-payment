import type { ApiPaymentWebhookEventType } from '../enums/api-payment-webhook-event-type.enum';

export interface OutboundWebhookEventMetadata {
  clientId: string;
  provider: string;
  environment: string;
  transactionId?: string;
  paymentId?: string;
}

export interface OutboundWebhookPayload<TData = Record<string, unknown>> {
  entityId: string;
  companyKey: string;
  name: ApiPaymentWebhookEventType;
  timestamp: string;
  correlationId: string;
  metadata: OutboundWebhookEventMetadata;
  data: TData;
}
