import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { WebhookProvider } from '../contracts/webhook.provider';

export const WEBHOOK_PROVIDERS = Symbol('WEBHOOK_PROVIDERS');

@Injectable()
export class WebhookProviderRegistry {
  private readonly providersBySlug: Map<FinancialProvider, WebhookProvider>;

  constructor(@Inject(WEBHOOK_PROVIDERS) providers: WebhookProvider[]) {
    this.providersBySlug = new Map(
      providers.map((provider) => [provider.providerSlug, provider]),
    );
  }

  get(providerSlug: FinancialProvider): WebhookProvider {
    const provider = this.providersBySlug.get(providerSlug);
    if (!provider) {
      throw new CustomHttpException(
        `Provider ${String(providerSlug)} não suportado`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }
    return provider;
  }
}
