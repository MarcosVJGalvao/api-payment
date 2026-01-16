/**
 * Exceção lançada quando um evento de webhook está fora de sequência.
 * Usada para sinalizar ao Bull Queue que o job deve ser re-tentado,
 * pois o evento anterior ainda pode estar sendo processado.
 */
export class WebhookOutOfSequenceRetryableException extends Error {
  public readonly authenticationCode: string;
  public readonly eventName: string;
  public readonly reason: string;

  constructor(authenticationCode: string, eventName: string, reason: string) {
    super(
      `Webhook out of sequence for authenticationCode: ${authenticationCode} (Event: ${eventName}). Reason: ${reason}. Will retry.`,
    );
    this.name = 'WebhookOutOfSequenceRetryableException';
    this.authenticationCode = authenticationCode;
    this.eventName = eventName;
    this.reason = reason;
  }
}
