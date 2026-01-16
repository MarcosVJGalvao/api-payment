/**
 * Enum de tipos de transação para a entidade Transaction.
 * Identifica a operação financeira realizada.
 */
export enum TransactionType {
  /** PIX recebido (cash-in) */
  PIX_CASH_IN = 'PIX_CASH_IN',
  /** PIX enviado (cash-out) */
  PIX_CASH_OUT = 'PIX_CASH_OUT',
  /** Devolução de PIX */
  PIX_REFUND = 'PIX_REFUND',
  /** Recebimento via boleto */
  BOLETO_CASH_IN = 'BOLETO_CASH_IN',
  /** Pagamento de conta */
  BILL_PAYMENT = 'BILL_PAYMENT',
  /** TED recebido */
  TED_IN = 'TED_IN',
  /** TED enviado */
  TED_OUT = 'TED_OUT',
}
