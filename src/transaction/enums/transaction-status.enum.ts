/**
 * Enum de status de transação para a entidade Transaction.
 * Status padronizado para extratos e consultas.
 */
export enum TransactionStatus {
  /** Transação pendente de processamento */
  PENDING = 'PENDING',
  /** Transação em processamento (recebida no core bancário) */
  IN_PROCESS = 'IN_PROCESS',
  /** Transação concluída com sucesso */
  DONE = 'DONE',
  /** Transação desfeita (hold falhou após reserva) */
  UNDONE = 'UNDONE',
  /** Transação cancelada */
  CANCELED = 'CANCELED',
  /** Transação falhou */
  FAILED = 'FAILED',
  /** Devolução pendente */
  REFUND_PENDING = 'REFUND_PENDING',
  /** Devolução concluída */
  REFUNDED = 'REFUNDED',
}
