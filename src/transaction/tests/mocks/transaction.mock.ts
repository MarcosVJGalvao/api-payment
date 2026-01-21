import { Transaction } from '../../entities/transaction.entity';
import { CreateTransactionFromWebhook } from '../../interfaces/transaction-webhook.interface';
import { TransactionType } from '../../enums/transaction-type.enum';
import { TransactionStatus } from '../../enums/transaction-status.enum';

export const mockTransaction = (): Transaction => {
  const transaction = new Transaction();
  transaction.id = 'uuid-transaction-1';
  transaction.authenticationCode = 'auth-code-123';
  transaction.status = TransactionStatus.DONE;
  transaction.amount = 100.5;
  transaction.currency = 'BRL';
  transaction.type = TransactionType.PIX_CASH_IN;
  transaction.clientId = 'uuid-client-1';
  transaction.createdAt = new Date();
  transaction.updatedAt = new Date();
  return transaction;
};

export const mockCreateTransactionFromWebhook =
  (): CreateTransactionFromWebhook => ({
    authenticationCode: 'auth-code-123',
    type: TransactionType.PIX_CASH_IN,
    status: TransactionStatus.DONE,
    amount: 100.5,
    clientId: 'uuid-client-1',
    currency: 'BRL',
  });
