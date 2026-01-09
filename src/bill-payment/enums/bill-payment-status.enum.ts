/**
 * Status do pagamento de contas conforme API Hiperbanco.
 */
export enum BillPaymentStatus {
  /** Título validado e pagamento sendo iniciado */
  CREATED = 'Created',
  /** Pagamento do título foi confirmado */
  COMPLETED = 'Completed',
  /** Pagamento compensado, valor na conta do beneficiário */
  CONFIRMED = 'Confirmed',
  /** Pagamento cancelado */
  CANCELLED = 'Cancelled',
}
