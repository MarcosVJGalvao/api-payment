import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionSemanticStatus } from '../enums/transaction-semantic-status.enum';
import { TransactionSource } from '../types/transaction-source.type';

export interface ITransactionResponse {
  id: string;
  authenticationCode: string;
  type: TransactionType;
  status: TransactionSemanticStatus;
  detailedStatus: TransactionStatus;
  amount: number;
  currency: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  providerTimestamp?: Date;
  details?: Partial<TransactionSource>;
}
