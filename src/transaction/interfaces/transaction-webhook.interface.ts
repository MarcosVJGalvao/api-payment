import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export interface CreateTransactionFromWebhook {
  authenticationCode: string;
  correlationId?: string;
  idempotencyKey?: string;
  entityId?: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency?: string;
  description?: string;
  accountId?: string;
  clientId: string;
  providerTimestamp?: Date;

  pixCashInId?: string;
  pixTransferId?: string;
  pixRefundId?: string;
  pixQrCodeId?: string;
  boletoId?: string;
  billPaymentId?: string;
  tedTransferId?: string;
  tedCashInId?: string;
  tedRefundId?: string;
}

export interface UpdateTransactionFromWebhook {
  authenticationCode: string;
  status: TransactionStatus;
  correlationId?: string;
  idempotencyKey?: string;
  entityId?: string;
  description?: string;
  providerTimestamp?: Date;
}
