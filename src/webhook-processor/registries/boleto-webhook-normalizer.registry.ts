import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { BoletoWebhookNormalizer } from '../contracts/boleto-webhook-normalizer';

export const BOLETO_WEBHOOK_NORMALIZERS = Symbol('BOLETO_WEBHOOK_NORMALIZERS');

@Injectable()
export class BoletoWebhookNormalizerRegistry {
  private readonly normalizers = new Map<
    FinancialProvider,
    BoletoWebhookNormalizer
  >();

  constructor(
    @Inject(BOLETO_WEBHOOK_NORMALIZERS)
    normalizers: BoletoWebhookNormalizer[],
  ) {
    normalizers.forEach((normalizer) => {
      this.normalizers.set(normalizer.providerSlug, normalizer);
    });
  }

  get(provider: FinancialProvider): BoletoWebhookNormalizer {
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
