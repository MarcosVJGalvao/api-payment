/**
 * Enum de status de PIX Cash-In.
 * Armazena status exatamente como vem do webhook.
 */
export enum PixCashInStatus {
  RECEIVED = 'RECEIVED',
  CLEARED = 'CLEARED',
  FAILED = 'FAILED',
}
