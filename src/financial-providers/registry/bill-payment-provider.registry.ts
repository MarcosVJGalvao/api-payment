import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { BillPaymentProvider } from '../contracts/bill-payment.provider';

export const BILL_PAYMENT_PROVIDERS = Symbol('BILL_PAYMENT_PROVIDERS');

@Injectable()
export class BillPaymentProviderRegistry {
  private readonly providersBySlug: Map<FinancialProvider, BillPaymentProvider>;

  constructor(
    @Inject(BILL_PAYMENT_PROVIDERS) providers: BillPaymentProvider[],
  ) {
    this.providersBySlug = new Map(
      providers.map((provider) => [provider.providerSlug, provider]),
    );
  }

  get(providerSlug: FinancialProvider): BillPaymentProvider {
    const provider = this.providersBySlug.get(providerSlug);
    if (!provider) {
      throw new CustomHttpException(
        `Provider ${String(providerSlug)} is not supported`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }
    return provider;
  }
}
