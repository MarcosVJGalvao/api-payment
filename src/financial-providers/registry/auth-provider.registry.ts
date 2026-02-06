import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AuthProvider } from '../contracts/auth.provider';

export const AUTH_PROVIDERS = Symbol('AUTH_PROVIDERS');

@Injectable()
export class AuthProviderRegistry {
  private readonly providersBySlug: Map<FinancialProvider, AuthProvider>;

  constructor(@Inject(AUTH_PROVIDERS) providers: AuthProvider[]) {
    this.providersBySlug = new Map(
      providers.map((provider) => [provider.providerSlug, provider]),
    );
  }

  get(providerSlug: FinancialProvider): AuthProvider {
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
