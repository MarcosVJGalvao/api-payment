/**
 * Exceção lançada quando uma transação não é encontrada mas é esperado que exista.
 * Usada para sinalizar ao Bull Queue que o job deve ser re-tentado.
 */
export class TransactionNotFoundRetryableException extends Error {
  public readonly authenticationCode: string;
  public readonly eventName: string;

  constructor(authenticationCode: string, eventName: string) {
    super(
      `Transaction not found for authenticationCode: ${authenticationCode} (Event: ${eventName}). Will retry.`,
    );
    this.name = 'TransactionNotFoundRetryableException';
    this.authenticationCode = authenticationCode;
    this.eventName = eventName;
  }
}
