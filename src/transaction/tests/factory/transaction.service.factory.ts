import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { TransactionService } from '../../transaction.service';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { Transaction } from '../../entities/transaction.entity';
import { TransactionHydratorService } from '../../services/transaction-hydrator.service';

export type TransactionServiceTestFactory = {
  transactionService: TransactionService;
  transactionRepositoryMock: Record<string, jest.Mock>;
  typeOrmRepositoryMock: Record<string, jest.Mock>;
  baseQueryServiceMock: Record<string, jest.Mock>;
  transactionHydratorMock: Record<string, jest.Mock>;
};

export const createTransactionServiceTestFactory =
  async (): Promise<TransactionServiceTestFactory> => {
    const transactionRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findByAuthenticationCode: jest.fn(),
      findByAccountId: jest.fn(),
    };

    const typeOrmRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const baseQueryServiceMock = {
      buildQueryOptions: jest.fn(),
      findAll: jest.fn(),
    };

    const transactionHydratorMock = {
      hydrate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: TransactionRepository,
          useValue: transactionRepositoryMock,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: typeOrmRepositoryMock,
        },
        {
          provide: BaseQueryService,
          useValue: baseQueryServiceMock,
        },
        {
          provide: TransactionHydratorService,
          useValue: transactionHydratorMock,
        },
      ],
    }).compile();

    return {
      transactionService: module.get<TransactionService>(TransactionService),
      transactionRepositoryMock,
      typeOrmRepositoryMock,
      baseQueryServiceMock,
      transactionHydratorMock,
    };
  };
