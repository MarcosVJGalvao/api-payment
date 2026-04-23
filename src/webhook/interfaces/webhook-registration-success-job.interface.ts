import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export interface WebhookRegistrationSuccessPayload {
  event: 'WEBHOOK_REGISTRATION_SUCCEEDED';
  status: 'SUCCESS';
  provider: FinancialProvider;
  clientId: string;
  webhookId: string;
  providerWebhookId: string;
  name: string;
  context: string;
  eventName: string;
  uri: string;
  publicKey?: string | null;
  occurredAt: string;
  providerRawResponse?: Record<string, unknown>;
}

export interface WebhookRegistrationSuccessJob {
  webhookId: string;
  callbackUri: string;
  callbackSecret?: string | null;
  payload: WebhookRegistrationSuccessPayload;
}
