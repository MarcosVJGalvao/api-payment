import { ProviderLoginType } from '../enums/provider-login-type.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export interface LoginBackofficeResult {
  accessToken: string;
  metadata?: Record<string, unknown>;
}

export interface LoginBankResult {
  accessToken: string;
  accountId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthProvider {
  readonly providerSlug: FinancialProvider;
  supports(loginType: ProviderLoginType): boolean;
  loginBackoffice(dto: unknown): Promise<LoginBackofficeResult>;
  loginBank(dto: unknown, clientId: string): Promise<LoginBankResult>;
}
