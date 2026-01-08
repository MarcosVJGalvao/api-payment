import { FinancialProvider } from '@/common/enums/financial-provider.enum';

/**
 * Interface para sessão de provedor armazenada no Redis
 */
export interface ProviderSession {
    sessionId: string;
    providerSlug: FinancialProvider;
    clientId: string;
    hiperbancoToken: string;
    userId?: string;
    accountId?: string;
    loginType: 'backoffice' | 'bank';
    createdAt: number;
    expiresAt: number;
}

export interface ProviderJwtPayload {
    sessionId: string;
    providerSlug: FinancialProvider;
    clientId: string;
    accountId?: string;
    loginType: 'backoffice' | 'bank';
}
