import { TransactionStatus } from '@/transaction/enums/transaction-status.enum';
import { BoletoStatus } from '@/boleto/enums/boleto-status.enum';
import { BillPaymentStatus } from '@/bill-payment/enums/bill-payment-status.enum';
import { PixTransferStatus } from '@/pix/enums/pix-transfer-status.enum';
import { TedTransferStatus } from '@/ted/enums/ted-transfer-status.enum';

/**
 * Mapeia BoletoStatus para TransactionStatus.
 */
export function mapBoletoStatusToTransactionStatus(
  status: BoletoStatus,
): TransactionStatus {
  const statusMap: Record<BoletoStatus, TransactionStatus> = {
    [BoletoStatus.PAID]: TransactionStatus.DONE,
    [BoletoStatus.REGISTERED]: TransactionStatus.PENDING,
    [BoletoStatus.PROCESSING]: TransactionStatus.IN_PROCESS,
    [BoletoStatus.PENDING]: TransactionStatus.PENDING,
    [BoletoStatus.APPROVED]: TransactionStatus.IN_PROCESS,
    [BoletoStatus.CANCELLED]: TransactionStatus.CANCELED,
    [BoletoStatus.EXPIRED]: TransactionStatus.CANCELED,
    [BoletoStatus.OVERDUE]: TransactionStatus.PENDING,
    [BoletoStatus.FAILURE]: TransactionStatus.FAILED,
  };

  return statusMap[status] || TransactionStatus.PENDING;
}

/**
 * Mapeia BillPaymentStatus para TransactionStatus.
 */
export function mapBillPaymentStatusToTransactionStatus(
  status: BillPaymentStatus,
): TransactionStatus {
  const statusMap: Record<BillPaymentStatus, TransactionStatus> = {
    [BillPaymentStatus.CREATED]: TransactionStatus.PENDING,
    [BillPaymentStatus.COMPLETED]: TransactionStatus.DONE,
    [BillPaymentStatus.CONFIRMED]: TransactionStatus.DONE,
    [BillPaymentStatus.CANCELLED]: TransactionStatus.CANCELED,
  };

  return statusMap[status] || TransactionStatus.PENDING;
}

/**
 * Mapeia PixTransferStatus para TransactionStatus.
 */
export function mapPixTransferStatusToTransactionStatus(
  status: PixTransferStatus,
): TransactionStatus {
  const statusMap: Record<PixTransferStatus, TransactionStatus> = {
    [PixTransferStatus.CREATED]: TransactionStatus.PENDING,
    [PixTransferStatus.IN_PROCESS]: TransactionStatus.IN_PROCESS,
    [PixTransferStatus.APPROVED]: TransactionStatus.IN_PROCESS,
    [PixTransferStatus.DONE]: TransactionStatus.DONE,
    [PixTransferStatus.CANCELED]: TransactionStatus.CANCELED,
    [PixTransferStatus.UNDONE]: TransactionStatus.UNDONE,
    [PixTransferStatus.REPROVED]: TransactionStatus.REPROVED,
  };

  return statusMap[status] || TransactionStatus.PENDING;
}

/**
 * Mapeia TedTransferStatus para TransactionStatus.
 */
export function mapTedTransferStatusToTransactionStatus(
  status: TedTransferStatus,
): TransactionStatus {
  // Import TedTransferStatus dynamically or move imports to avoid circular dependency if needed.
  // Assuming TedTransferStatus is available or passed as string/enum.
  // Ideally, import it at the top.
  const statusMap: Record<string, TransactionStatus> = {
    CREATED: TransactionStatus.PENDING,
    IN_PROCESS: TransactionStatus.IN_PROCESS,
    APPROVED: TransactionStatus.IN_PROCESS,
    DONE: TransactionStatus.DONE,
    UNDONE: TransactionStatus.UNDONE,
    CANCELED: TransactionStatus.CANCELED,
    FAILED: TransactionStatus.FAILED,
    REPROVED: TransactionStatus.REPROVED,
  };

  return statusMap[status] || TransactionStatus.PENDING;
}
