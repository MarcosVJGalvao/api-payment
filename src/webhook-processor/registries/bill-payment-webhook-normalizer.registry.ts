import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { BillPaymentWebhookNormalizer } from '../contracts/bill-payment-webhook-normalizer';

export const BILL_PAYMENT_WEBHOOK_NORMALIZERS = Symbol(
  'BILL_PAYMENT_WEBHOOK_NORMALIZERS',
);

@Injectable()
export class BillPaymentWebhookNormalizerRegistry {
  private readonly normalizers = new Map<
    FinancialProvider,
    BillPaymentWebhookNormalizer
  >();

  constructor(
    @Inject(BILL_PAYMENT_WEBHOOK_NORMALIZERS)
    normalizers: BillPaymentWebhookNormalizer[],
  ) {
    normalizers.forEach((normalizer) => {
      this.normalizers.set(normalizer.providerSlug, normalizer);
    });
  }

  get(provider: FinancialProvider): BillPaymentWebhookNormalizer {
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
