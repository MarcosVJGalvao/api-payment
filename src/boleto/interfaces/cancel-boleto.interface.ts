/**
 * Dados mínimos necessários para cancelar um boleto no provedor.
 */
export interface IBoletoCancelData {
  authenticationCode: string;
  accountNumber: string;
  accountBranch: string;
}
