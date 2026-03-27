import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { BoletoProvider } from '../contracts/boleto.provider';

export const BOLETO_PROVIDERS = Symbol('BOLETO_PROVIDERS');

@Injectable()
export class BoletoProviderRegistry {
  private readonly providersBySlug: Map<FinancialProvider, BoletoProvider>;

  constructor(@Inject(BOLETO_PROVIDERS) providers: BoletoProvider[]) {
    this.providersBySlug = new Map(
      providers.map((provider) => [provider.providerSlug, provider]),
    );
  }

  get(providerSlug: FinancialProvider): BoletoProvider {
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
