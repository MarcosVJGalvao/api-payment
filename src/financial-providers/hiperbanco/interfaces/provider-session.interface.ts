import type { ProviderSession as CanonicalProviderSession } from '../../contracts/provider-session';

/**
 * Compatibilidade: a base do projeto migrou para `contracts/provider-session`.
 * Este tipo permanece para evitar quebra imediata de imports existentes.
 *
 * @deprecated Use `@/financial-providers/contracts/provider-session`.
 */
export type ProviderSession = CanonicalProviderSession & {
  /** @deprecated Use `accessToken` ou `metadata` no formato canônico. */
  hiperbancoToken?: string;
};

export type ProviderJwtPayload =
  import('../../contracts/provider-session').ProviderJwtPayload;
