import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderLoginType } from '../enums/provider-login-type.enum';
import { isRecord } from '@/common/errors/helpers/type.helpers';

/**
 * Sessão canônica de provedor armazenada no Redis.
 * Deve ser agnóstica ao provedor (tokens/claims específicos em `metadata`).
 */
export interface ProviderSession {
  sessionId: string;
  providerSlug: FinancialProvider;
  clientId: string;
  accountId?: string;
  loginType: ProviderLoginType;
  createdAt: number;
  expiresAt: number;
  accessToken?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderJwtPayload {
  sessionId: string;
  providerSlug: FinancialProvider;
  clientId: string;
  accountId?: string;
  loginType: ProviderLoginType;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isProviderSession(value: unknown): value is ProviderSession {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['sessionId'] === 'string' &&
    typeof value['providerSlug'] === 'string' &&
    typeof value['clientId'] === 'string' &&
    typeof value['loginType'] === 'string' &&
    isNumber(value['createdAt']) &&
    isNumber(value['expiresAt']) &&
    (value['accountId'] === undefined || typeof value['accountId'] === 'string')
  );
}
