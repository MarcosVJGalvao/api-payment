import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionSemanticStatus } from '../enums/transaction-semantic-status.enum';

export interface ITransactionSummary {
  id: string;
  type: TransactionType;
  status: TransactionSemanticStatus;
  detailedStatus: TransactionStatus;
  description?: string | null;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  providerTimestamp?: Date;
  senderName?: string | null;
  recipientName?: string | null;
}
