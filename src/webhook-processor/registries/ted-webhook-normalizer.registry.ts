import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { TedWebhookNormalizer } from '../contracts/ted-webhook-normalizer';

export const TED_WEBHOOK_NORMALIZERS = Symbol('TED_WEBHOOK_NORMALIZERS');

@Injectable()
export class TedWebhookNormalizerRegistry {
  private readonly normalizers = new Map<
    FinancialProvider,
    TedWebhookNormalizer
  >();

  constructor(
    @Inject(TED_WEBHOOK_NORMALIZERS)
    normalizers: TedWebhookNormalizer[],
  ) {
    normalizers.forEach((normalizer) => {
      this.normalizers.set(normalizer.providerSlug, normalizer);
    });
  }

  get(provider: FinancialProvider): TedWebhookNormalizer {
    const normalizer = this.normalizers.get(provider);
    if (!normalizer) {
      throw new CustomHttpException(
        `Webhook normalizer not found for provider ${provider}`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_FINANCIAL_PROVIDER,
      );
    }
    return normalizer;
  }
}
