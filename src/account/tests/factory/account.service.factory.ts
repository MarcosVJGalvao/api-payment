import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountService } from '../../account.service';
import { Account } from '../../entities/account.entity';

export type AccountServiceTestFactory = {
  accountService: AccountService;
  accountRepositoryMock: Record<string, jest.Mock>;
};

export const createAccountServiceTestFactory =
  async (): Promise<AccountServiceTestFactory> => {
    const accountRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepositoryMock,
        },
      ],
    }).compile();

    return {
      accountService: module.get<AccountService>(AccountService),
      accountRepositoryMock,
    };
  };
