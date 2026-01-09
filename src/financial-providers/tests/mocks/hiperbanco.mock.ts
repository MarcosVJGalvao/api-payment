import { ProviderCredential } from '../../entities/provider-credential.entity';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

/**
 * Cria um mock de ProviderCredential com valores padrão.
 */
export const mockProviderCredential = (
  overrides?: Partial<ProviderCredential>,
): ProviderCredential => {
  const credential = new ProviderCredential();
  credential.id = '550e8400-e29b-41d4-a716-446655440000';
  credential.provider_slug = FinancialProvider.HIPERBANCO;
  credential.login = 'user@test.com';
  credential.password = 'encrypted-password';
  credential.clientId = 'internal-client-id-123';
  credential.createdAt = new Date('2026-01-01T00:00:00.000Z');
  credential.updatedAt = new Date('2026-01-01T00:00:00.000Z');
  credential.deletedAt = undefined;

  return { ...credential, ...overrides } as ProviderCredential;
};

/**
 * Cria um mock de ProviderCredential com senha descriptografada.
 */
export const mockDecryptedCredential = (
  overrides?: Partial<ProviderCredential>,
): ProviderCredential => {
  return mockProviderCredential({
    password: 'decrypted-password',
    ...overrides,
  });
};

/**
 * Mock de resposta de login do Hiperbanco Backoffice.
 */
export const mockBackofficeLoginResponse = () => ({
  token: 'mock-backoffice-token',
  expiresIn: 3600,
  user: {
    id: 'backoffice-user-id',
    email: 'user@test.com',
  },
});

/**
 * Mock de resposta de login bancário do Hiperbanco.
 */
export const mockBankLoginResponse = () => ({
  token: 'mock-bank-token',
  session: 'session-id-123',
  user: {
    id: 'bank-user-id',
    document: '52365478526',
    name: 'João Silva',
  },
});
