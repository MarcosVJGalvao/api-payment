import { Injectable, Logger } from '@nestjs/common';
import { TransactionRepository } from './repositories/transaction.repository';
import { Transaction } from './entities/transaction.entity';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionStatus } from './enums/transaction-status.enum';

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

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly transactionRepository: TransactionRepository) {}

  async createFromWebhook(
    data: CreateTransactionFromWebhook,
  ): Promise<Transaction> {
    const existing = await this.transactionRepository.findByAuthenticationCode(
      data.authenticationCode,
    );

    if (existing) {
      this.logger.log(
        `Transaction already exists for authenticationCode: ${data.authenticationCode}`,
      );
      return existing;
    }

    const transaction = this.transactionRepository.create({
      ...data,
      currency: data.currency || 'BRL',
    });

    const saved = await this.transactionRepository.save(transaction);

    this.logger.log(
      `Created transaction ${saved.id} for authenticationCode: ${data.authenticationCode}`,
    );

    return saved;
  }

  async updateStatus(
    authenticationCode: string,
    status: TransactionStatus,
  ): Promise<Transaction | null> {
    const transaction =
      await this.transactionRepository.findByAuthenticationCode(
        authenticationCode,
      );

    if (!transaction) {
      this.logger.warn(
        `Transaction not found for authenticationCode: ${authenticationCode}`,
      );
      return null;
    }

    transaction.status = status;
    const updated = await this.transactionRepository.save(transaction);

    this.logger.log(`Updated transaction ${updated.id} status to: ${status}`);

    return updated;
  }

  async updateFromWebhook(
    data: UpdateTransactionFromWebhook,
  ): Promise<Transaction | null> {
    const transaction =
      await this.transactionRepository.findByAuthenticationCode(
        data.authenticationCode,
      );

    if (!transaction) {
      this.logger.warn(
        `Transaction not found for authenticationCode: ${data.authenticationCode}`,
      );
      return null;
    }

    transaction.status = data.status;

    if (data.correlationId) transaction.correlationId = data.correlationId;
    if (data.idempotencyKey) transaction.idempotencyKey = data.idempotencyKey;
    if (data.entityId) transaction.entityId = data.entityId;
    if (data.description) transaction.description = data.description;
    if (data.providerTimestamp)
      transaction.providerTimestamp = data.providerTimestamp;

    const updated = await this.transactionRepository.save(transaction);

    this.logger.log(
      `Updated transaction ${updated.id} from webhook: status=${data.status}`,
    );

    return updated;
  }

  async findByAuthenticationCode(
    authenticationCode: string,
  ): Promise<Transaction | null> {
    return this.transactionRepository.findByAuthenticationCode(
      authenticationCode,
    );
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByAccountId(accountId);
  }
}
