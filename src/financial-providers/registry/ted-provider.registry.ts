import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { TedProvider } from '../contracts/ted.provider';

export const TED_PROVIDERS = Symbol('TED_PROVIDERS');

@Injectable()
export class TedProviderRegistry {
  private readonly providersBySlug: Map<FinancialProvider, TedProvider>;

  constructor(@Inject(TED_PROVIDERS) providers: TedProvider[]) {
    this.providersBySlug = new Map(
      providers.map((provider) => [provider.providerSlug, provider]),
    );
  }

  get(providerSlug: FinancialProvider): TedProvider {
    const provider = this.providersBySlug.get(providerSlug);
    if (!provider) {
      throw new CustomHttpException(
        `Provider ${String(providerSlug)} is not supported for TED`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }
    return provider;
  }
}
