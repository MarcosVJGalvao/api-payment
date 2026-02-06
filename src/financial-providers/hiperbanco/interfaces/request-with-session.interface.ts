import type { RequestWithAccount } from '@/financial-providers/guards/account.guard';
import type { RequestWithSession as CanonicalRequestWithSession } from '../../contracts/request-with-session.interface';

/**
 * Interface para Request que inclui ProviderSession.
 * Usada em rotas que precisam de autenticação de provider.
 */
/**
 * Compatibilidade.
 * @deprecated Use `@/financial-providers/contracts/request-with-session.interface`.
 */
export type RequestWithSession = CanonicalRequestWithSession &
  RequestWithAccount;
