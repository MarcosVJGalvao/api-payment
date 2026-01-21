import { TransactionService } from '../transaction.service';
import { createTransactionServiceTestFactory } from './factory/transaction.service.factory';
import {
  mockTransaction,
  mockCreateTransactionFromWebhook,
} from './mocks/transaction.mock';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { Transaction } from '../entities/transaction.entity';
import { GetTransactionsQueryDto } from '../dto/get-transactions-query.dto';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

describe('TransactionService', () => {
  let service: TransactionService;
  let repositoryMock: any;
  let typeOrmRepositoryMock: any;
  let baseQueryServiceMock: any;

  beforeEach(async () => {
    const factory = await createTransactionServiceTestFactory();
    service = factory.transactionService;
    repositoryMock = factory.transactionRepositoryMock;
    typeOrmRepositoryMock = factory.typeOrmRepositoryMock;
    baseQueryServiceMock = factory.baseQueryServiceMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFromWebhook', () => {
    it('should create new transaction when not exists', async () => {
      const data = mockCreateTransactionFromWebhook();
      const createdTransaction = mockTransaction();

      repositoryMock.findByAuthenticationCode.mockResolvedValue(null);
      repositoryMock.create.mockReturnValue(createdTransaction);
      repositoryMock.save.mockResolvedValue(createdTransaction);

      const result = await service.createFromWebhook(data);

      expect(repositoryMock.findByAuthenticationCode).toHaveBeenCalledWith(
        data.authenticationCode,
      );
      expect(repositoryMock.create).toHaveBeenCalledWith({
        ...data,
        currency: 'BRL',
      });
      expect(repositoryMock.save).toHaveBeenCalledWith(createdTransaction);
      expect(result).toEqual(createdTransaction);
    });

    it('should return existing transaction if already exists', async () => {
      const data = mockCreateTransactionFromWebhook();
      const existingTransaction = mockTransaction();

      repositoryMock.findByAuthenticationCode.mockResolvedValue(
        existingTransaction,
      );

      const result = await service.createFromWebhook(data);

      expect(repositoryMock.findByAuthenticationCode).toHaveBeenCalledWith(
        data.authenticationCode,
      );
      expect(repositoryMock.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingTransaction);
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      const authCode = 'auth-123';
      const status = TransactionStatus.FAILED;
      const transaction = mockTransaction();

      repositoryMock.findByAuthenticationCode.mockResolvedValue(transaction);
      repositoryMock.save.mockResolvedValue({ ...transaction, status });

      const result = await service.updateStatus(authCode, status);

      expect(repositoryMock.findByAuthenticationCode).toHaveBeenCalledWith(
        authCode,
      );
      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ status }),
      );
      expect(result?.status).toBe(status);
    });

    it('should return null if transaction not found', async () => {
      const authCode = 'auth-123';
      const status = TransactionStatus.FAILED;

      repositoryMock.findByAuthenticationCode.mockResolvedValue(null);

      const result = await service.updateStatus(authCode, status);

      expect(result).toBeNull();
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should call baseQueryService with correct parameters', async () => {
      const accountId = 'account-123';
      const clientId = 'client-123';
      const query: GetTransactionsQueryDto = {
        page: 1,
        limit: 10,
        type: TransactionType.PIX_CASH_IN,
        detailedStatus: TransactionStatus.PENDING,
      };

      const paginationResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      baseQueryServiceMock.buildQueryOptions.mockReturnValue({
        // ... mocked options
        filters: [],
      });
      baseQueryServiceMock.findAll.mockResolvedValue(paginationResult);

      const result = await service.findAll(accountId, clientId, query);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalledWith(
        typeOrmRepositoryMock,
        expect.objectContaining({
          ...query,
          accountId,
          clientId,
        }),
        expect.objectContaining({
          searchFields: ['authenticationCode', 'description'],
          defaultSortBy: 'createdAt',
          filters: [
            {
              field: 'accountId',
              operator: 'equals',
            },
            {
              field: 'clientId',
              operator: 'equals',
            },
            {
              field: 'type',
              operator: 'equals',
            },
            {
              field: 'detailedStatus',
              mapField: 'status',
              operator: 'equals',
            },
            {
              field: 'status',
              ignore: true,
            },
          ],
        }),
      );
      expect(baseQueryServiceMock.findAll).toHaveBeenCalledWith(
        typeOrmRepositoryMock,
        expect.anything(),
      );
      expect(result).toEqual(paginationResult);
    });

    it('should add semantic status filter when provided', async () => {
      const accountId = 'account-123';
      const clientId = 'client-123';
      const query: GetTransactionsQueryDto = {
        page: 1,
        limit: 10,
        status: 'PROCESSING' as any,
      };

      const queryOptions = { filters: [] };
      baseQueryServiceMock.buildQueryOptions.mockReturnValue(queryOptions);
      baseQueryServiceMock.findAll.mockResolvedValue({ data: [], meta: {} });

      await service.findAll(accountId, clientId, query);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalled();

      expect(baseQueryServiceMock.findAll).toHaveBeenCalledWith(
        typeOrmRepositoryMock,
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.objectContaining({
              field: 'status',
              operator: 'in',
            }),
          ]),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return transaction if found and belongs to account', async () => {
      const id = 'uuid-transaction-1';
      const accountId = 'account-123';
      const clientId = 'client-123';
      const transaction = new Transaction();
      typeOrmRepositoryMock.findOne.mockResolvedValue(transaction);

      const result = await service.findOne(id, accountId, clientId);

      expect(typeOrmRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id, accountId, clientId },
      });
      expect(result).toEqual(transaction);
    });

    it('should throw CustomHttpException if transaction not found', async () => {
      const id = 'uuid-transaction-1';
      const accountId = 'account-123';
      const clientId = 'client-123';
      typeOrmRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(id, accountId, clientId)).rejects.toThrow(
        CustomHttpException,
      );
      await expect(service.findOne(id, accountId, clientId)).rejects.toThrow(
        expect.objectContaining({
          errorCode: ErrorCode.TRANSACTION_NOT_FOUND,
        }),
      );
    });
  });
});
