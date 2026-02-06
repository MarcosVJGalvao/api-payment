import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { PixProvider } from '../contracts/pix.provider';

export const PIX_PROVIDERS = Symbol('PIX_PROVIDERS');

@Injectable()
export class PixProviderRegistry {
  private readonly providersBySlug: Map<FinancialProvider, PixProvider>;

  constructor(@Inject(PIX_PROVIDERS) providers: PixProvider[]) {
    this.providersBySlug = new Map(
      providers.map((provider) => [provider.providerSlug, provider]),
    );
  }

  get(providerSlug: FinancialProvider): PixProvider {
    const provider = this.providersBySlug.get(providerSlug);
    if (!provider) {
      throw new CustomHttpException(
        `Provider ${String(providerSlug)} is not supported for PIX`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }
    return provider;
  }
}
