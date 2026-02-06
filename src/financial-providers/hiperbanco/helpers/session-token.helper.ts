import type { ProviderSession } from '@/financial-providers/contracts/provider-session';

type LegacySession = { hiperbancoToken?: string };

export function getProviderAccessToken(
  session: ProviderSession | LegacySession,
): string {
  if ('accessToken' in session && session.accessToken) {
    return session.accessToken;
  }
  if ('hiperbancoToken' in session && session.hiperbancoToken) {
    return session.hiperbancoToken;
  }
  return '';
}
