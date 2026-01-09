import { RequestWithAccount } from '@/financial-providers/guards/account.guard';
import { ProviderSession } from './provider-session.interface';

/**
 * Interface para Request que inclui ProviderSession.
 * Usada em rotas que precisam de autenticação de provider.
 */
export interface RequestWithSession extends RequestWithAccount {
  providerSession: ProviderSession;
}
