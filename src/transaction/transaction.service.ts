import { Injectable, Logger } from '@nestjs/common';
import { TransactionRepository } from './repositories/transaction.repository';
import { Transaction } from './entities/transaction.entity';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionStatus } from './enums/transaction-status.enum';

/**
 * Interface para criação de transação via webhook.
 */
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
  // FKs opcionais
  pixCashInId?: string;
  pixTransferId?: string;
  pixRefundId?: string;
  boletoId?: string;
  billPaymentId?: string;
}

/**
 * Interface para atualização de transação via webhook.
 */
export interface UpdateTransactionFromWebhook {
  authenticationCode: string;
  status: TransactionStatus;
  correlationId?: string;
  idempotencyKey?: string;
  entityId?: string;
  description?: string;
  providerTimestamp?: Date;
}

/**
 * Service para gerenciamento de transações.
 */
@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly transactionRepository: TransactionRepository) {}

  /**
   * Cria uma nova transação a partir de dados de webhook.
   * Verifica idempotência pelo authenticationCode.
   */
  async createFromWebhook(
    data: CreateTransactionFromWebhook,
  ): Promise<Transaction> {
    // Verificar se já existe (idempotência)
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

  /**
   * Atualiza o status de uma transação existente.
   */
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

  /**
   * Atualiza uma transação existente com dados do webhook.
   */
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

  /**
   * Busca transação por authenticationCode.
   */
  async findByAuthenticationCode(
    authenticationCode: string,
  ): Promise<Transaction | null> {
    return this.transactionRepository.findByAuthenticationCode(
      authenticationCode,
    );
  }

  /**
   * Lista transações por conta (para extratos).
   */
  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByAccountId(accountId);
  }
}
