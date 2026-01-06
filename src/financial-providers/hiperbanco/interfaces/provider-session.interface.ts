/**
 * Interface para sessão de provedor armazenada no Redis
 */
export interface ProviderSession {
    sessionId: string;
    providerSlug: string;
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
    providerSlug: string;
    clientId: string;
    loginType: 'backoffice' | 'bank';
}
