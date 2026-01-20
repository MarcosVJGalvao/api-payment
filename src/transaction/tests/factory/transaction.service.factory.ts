import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from '../../transaction.service';
import { TransactionRepository } from '../../repositories/transaction.repository';

export type TransactionServiceTestFactory = {
  transactionService: TransactionService;
  transactionRepositoryMock: Record<string, jest.Mock>;
};

export const createTransactionServiceTestFactory =
  async (): Promise<TransactionServiceTestFactory> => {
    const transactionRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findByAuthenticationCode: jest.fn(),
      findByAccountId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: TransactionRepository,
          useValue: transactionRepositoryMock,
        },
      ],
    }).compile();

    return {
      transactionService: module.get<TransactionService>(TransactionService),
      transactionRepositoryMock,
    };
  };
