import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { BoletoWebhookNormalizer } from '@/webhook-processor/contracts/boleto-webhook-normalizer';
import { WebhookPayload } from '@/webhook-processor/interfaces/webhook-base.interface';
import { BoletoWebhookData } from '@/webhook-processor/interfaces/boleto-webhook.interface';

@Injectable()
export class HiperbancoBoletoWebhookNormalizer implements BoletoWebhookNormalizer {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  normalizeRegistered(
    events: WebhookPayload<BoletoWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BoletoWebhookData>[] {
    return events;
  }

  normalizeCashInReceived(
    events: WebhookPayload<BoletoWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BoletoWebhookData>[] {
    return events;
  }

  normalizeCashInCleared(
    events: WebhookPayload<BoletoWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BoletoWebhookData>[] {
    return events;
  }

  normalizeCancelled(
    events: WebhookPayload<BoletoWebhookData>[],
    _headers: Record<string, unknown>,
  ): WebhookPayload<BoletoWebhookData>[] {
    return events;
  }
}
