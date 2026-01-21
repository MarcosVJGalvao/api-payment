import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BackofficeUserService } from '../../services/backoffice-user.service';
import { BackofficeUser } from '../../entities/backoffice-user.entity';
import { AppLoggerService } from '@/common/logger/logger.service';

export type BackofficeUserServiceTestFactory = {
  backofficeUserService: BackofficeUserService;
  backofficeUserRepositoryMock: Record<string, jest.Mock>;
  loggerMock: Record<string, jest.Mock>;
};

export const createBackofficeUserServiceTestFactory =
  async (): Promise<BackofficeUserServiceTestFactory> => {
    const backofficeUserRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackofficeUserService,
        {
          provide: getRepositoryToken(BackofficeUser),
          useValue: backofficeUserRepositoryMock,
        },
        {
          provide: AppLoggerService,
          useValue: loggerMock,
        },
      ],
    }).compile();

    return {
      backofficeUserService: module.get<BackofficeUserService>(
        BackofficeUserService,
      ),
      backofficeUserRepositoryMock,
      loggerMock,
    };
  };
