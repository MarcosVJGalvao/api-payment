import { TransactionStatus } from '@/transaction/enums/transaction-status.enum';

/**
 * Mapeia evento de webhook para TransactionStatus padronizado.
 */
export function mapWebhookEventToTransactionStatus(
  eventName: string,
): TransactionStatus {
  const eventStatusMap: Record<string, TransactionStatus> = {
    PIX_CASH_IN_WAS_RECEIVED: TransactionStatus.IN_PROCESS,
    PIX_CASH_IN_WAS_CLEARED: TransactionStatus.DONE,

    PIX_CASHOUT_WAS_COMPLETED: TransactionStatus.DONE,
    PIX_CASHOUT_WAS_CANCELED: TransactionStatus.CANCELED,
    PIX_CASHOUT_WAS_UNDONE: TransactionStatus.UNDONE,

    PIX_REFUND_WAS_RECEIVED: TransactionStatus.REFUND_PENDING,
    PIX_REFUND_WAS_CLEARED: TransactionStatus.REFUNDED,

    BOLETO_WAS_REGISTERED: TransactionStatus.PENDING,
    BOLETO_CASH_IN_WAS_RECEIVED: TransactionStatus.IN_PROCESS,
    BOLETO_CASH_IN_WAS_CLEARED: TransactionStatus.DONE,
    BOLETO_WAS_CANCELLED: TransactionStatus.CANCELED,

    BILL_PAYMENT_WAS_RECEIVED: TransactionStatus.IN_PROCESS,
    BILL_PAYMENT_WAS_CREATED: TransactionStatus.IN_PROCESS,
    BILL_PAYMENT_WAS_CONFIRMED: TransactionStatus.DONE,
    BILL_PAYMENT_HAS_FAILED: TransactionStatus.FAILED,
    BILL_PAYMENT_WAS_CANCELLED: TransactionStatus.CANCELED,
    BILL_PAYMENT_WAS_REFUSED: TransactionStatus.FAILED,
  };

  return eventStatusMap[eventName] || TransactionStatus.PENDING;
}
