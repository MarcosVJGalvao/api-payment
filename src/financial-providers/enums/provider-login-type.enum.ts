/**
 * Enum para tipos de login do provedor financeiro.
 * - BACKOFFICE: Login usando email e senha
 * - BANK: Login usando documento (CPF/CNPJ) e senha
 */
export enum ProviderLoginType {
  BACKOFFICE = 'backoffice',
  BANK = 'bank',
}
