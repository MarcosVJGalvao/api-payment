/**
 * Lista de variáveis de ambiente que devem ser buscadas do Oracle Vault
 * quando SECRETS_SOURCE=VAULT.
 *
 * IMPORTANTE:
 * - Quando SECRETS_SOURCE=VAULT: essas variáveis NÃO devem estar no .env (vêm do Vault)
 *   Outras variáveis (DB_DATABASE, PORT, NODE_ENV, etc.) continuam vindo do .env
 * - Quando SECRETS_SOURCE=ENV: todas as variáveis (incluindo essas) devem estar no .env
 */
export const SECRETS_MAPPING = [
  'DB_PASSWORD',
  'DB_USERNAME',
  'DB_HOST',
  'DB_PORT',
  'JWT_SECRET',
  'REDIS_PASSWORD',
  'UPSTASH_REDIS_URL',
  'R2_SECRET_ACCESS_KEY',
  'R2_ACCESS_KEY_ID',
  'R2_ACCOUNT_ID',
  'WEBHOOK_ENCRYPTION_KEY',
] as const;

