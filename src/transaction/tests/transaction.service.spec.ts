import { TransactionService } from '../transaction.service';
import { createTransactionServiceTestFactory } from './factory/transaction.service.factory';
import {
  mockTransaction,
  mockCreateTransactionFromWebhook,
} from './mocks/transaction.mock';
import { TransactionStatus } from '../enums/transaction-status.enum';

describe('TransactionService', () => {
  let service: TransactionService;
  let repositoryMock: any;

  beforeEach(async () => {
    const factory = await createTransactionServiceTestFactory();
    service = factory.transactionService;
    repositoryMock = factory.transactionRepositoryMock;
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
});
