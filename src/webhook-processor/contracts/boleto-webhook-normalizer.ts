import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BoletoWebhookData } from '../interfaces/boleto-webhook.interface';

export interface BoletoWebhookNormalizer {
  readonly providerSlug: FinancialProvider;

  normalizeRegistered(
    events: WebhookPayload<BoletoWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BoletoWebhookData>[];

  normalizeCashInReceived(
    events: WebhookPayload<BoletoWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BoletoWebhookData>[];

  normalizeCashInCleared(
    events: WebhookPayload<BoletoWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BoletoWebhookData>[];

  normalizeCancelled(
    events: WebhookPayload<BoletoWebhookData>[],
    headers: Record<string, unknown>,
  ): WebhookPayload<BoletoWebhookData>[];
}
