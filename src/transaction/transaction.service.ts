import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionRepository } from './repositories/transaction.repository';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { FilterOperator } from '@/common/base-query/enums/filter-operator.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import {
  CreateTransactionFromWebhook,
  UpdateTransactionFromWebhook,
} from './interfaces/transaction-webhook.interface';
import { getDetailedStatuses } from './helpers/transaction-status.helper';
import { FilterConfig } from '@/common/base-query/interfaces/query-options.interface';
import { TransactionHydratorService } from './services/transaction-hydrator.service';
import { applyDefined } from '@/common/helpers/apply-defined.helper';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private readonly transactionRepository: TransactionRepository,
    @InjectRepository(Transaction)
    private readonly typeOrmRepository: Repository<Transaction>,
    private readonly baseQueryService: BaseQueryService,
    private readonly transactionHydrator: TransactionHydratorService,
  ) {}

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

    applyDefined(transaction, data, [
      'correlationId',
      'idempotencyKey',
      'entityId',
      'description',
      'providerTimestamp',
    ]);

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

  async findAll(
    accountId: string,
    clientId: string,
    query: GetTransactionsQueryDto,
  ): Promise<PaginationResult<Transaction>> {
    const queryWithFilters = { ...query, accountId, clientId };

    const filterConfigs: FilterConfig[] = [
      {
        field: 'accountId',
        operator: FilterOperator.EQUALS,
      },
      {
        field: 'clientId',
        operator: FilterOperator.EQUALS,
      },
      {
        field: 'type',
        operator: FilterOperator.EQUALS,
      },
      {
        field: 'detailedStatus',
        mapField: 'status',
        operator: FilterOperator.EQUALS,
      },
      {
        field: 'status',
        ignore: true,
      },
    ];

    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.typeOrmRepository,
      queryWithFilters,
      {
        searchFields: ['authenticationCode', 'description'],
        defaultSortBy: 'createdAt',
        filters: filterConfigs,
        relations: [],
      },
    );

    if (!queryOptions.filters) {
      queryOptions.filters = [];
    }

    if (query.status) {
      const detailedStatuses = getDetailedStatuses(query.status);
      queryOptions.filters.push({
        field: 'status',
        operator: FilterOperator.IN,
        value: detailedStatuses,
      });
    }

    const result = await this.baseQueryService.findAll(
      this.typeOrmRepository,
      queryOptions,
    );

    if (result.data.length > 0) {
      await this.transactionHydrator.hydrate(result.data);
    }

    return result;
  }

  async findOne(
    id: string,
    accountId: string,
    clientId: string,
  ): Promise<Transaction> {
    const transaction = await this.typeOrmRepository.findOne({
      where: { id, accountId, clientId },
    });

    if (!transaction) {
      throw new CustomHttpException(
        'Transaction not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.TRANSACTION_NOT_FOUND,
      );
    }

    await this.transactionHydrator.hydrate([transaction]);

    return transaction;
  }
}
