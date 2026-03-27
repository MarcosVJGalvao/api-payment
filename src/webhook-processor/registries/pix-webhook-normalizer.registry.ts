import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { PixWebhookNormalizer } from '../contracts/pix-webhook-normalizer';

export const PIX_WEBHOOK_NORMALIZERS = Symbol('PIX_WEBHOOK_NORMALIZERS');

@Injectable()
export class PixWebhookNormalizerRegistry {
  private readonly normalizers = new Map<
    FinancialProvider,
    PixWebhookNormalizer
  >();

  constructor(
    @Inject(PIX_WEBHOOK_NORMALIZERS)
    normalizers: PixWebhookNormalizer[],
  ) {
    normalizers.forEach((normalizer) => {
      this.normalizers.set(normalizer.providerSlug, normalizer);
    });
  }

  get(provider: FinancialProvider): PixWebhookNormalizer {
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
