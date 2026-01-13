import { AmountData } from './webhook-base.interface';

export interface BillPaymentErrorData {
  code: string;
  message: string;
}

export interface BillPaymentWebhookData {
  authenticationCode: string;
  paymentStatus?: string;
  transactionId?: string;
  confirmationTransactionId?: number;
  confirmedAt?: string;
  settleDate?: string;
  paymentDate?: string;
  updatedAt?: string;
  error?: BillPaymentErrorData;
  reason?: string;
  amount?: AmountData;
}
