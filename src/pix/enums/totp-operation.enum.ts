/**
 * Finalidade da geração do código TOTP
 * - RegisterEntry: Cadastro de nova chave
 * - Portability: Portabilidade de chave
 * - Ownership: Reivindicação de posse
 */
export enum TotpOperation {
  REGISTER_ENTRY = 'RegisterEntry',
  PORTABILITY = 'Portability',
  OWNERSHIP = 'Ownership',
}
