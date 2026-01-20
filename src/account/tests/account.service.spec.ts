import { HttpStatus } from '@nestjs/common';
import { AccountService } from '../account.service';
import { createAccountServiceTestFactory } from './factory/account.service.factory';
import {
  mockAccount,
  mockCreateOrUpdateAccountData,
} from './mocks/account.mock';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

describe('AccountService', () => {
  let service: AccountService;
  let accountRepositoryMock: any;

  beforeEach(async () => {
    const factory = await createAccountServiceTestFactory();
    service = factory.accountService;
    accountRepositoryMock = factory.accountRepositoryMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdate', () => {
    it('should create new account when not exists', async () => {
      const data = mockCreateOrUpdateAccountData();
      const externalId = 'ext-12345';
      const clientId = 'uuid-client-1';
      const createdAccount = mockAccount();

      accountRepositoryMock.findOne.mockResolvedValue(null);
      accountRepositoryMock.create.mockReturnValue(createdAccount);
      accountRepositoryMock.save.mockResolvedValue(createdAccount);

      const result = await service.createOrUpdate(externalId, clientId, data);

      expect(accountRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { externalId, clientId },
      });
      expect(accountRepositoryMock.create).toHaveBeenCalledWith({
        externalId,
        clientId,
        ...data,
      });
      expect(accountRepositoryMock.save).toHaveBeenCalledWith(createdAccount);
      expect(result).toEqual(createdAccount);
    });

    it('should update existing account', async () => {
      const data = mockCreateOrUpdateAccountData();
      const externalId = 'ext-12345';
      const clientId = 'uuid-client-1';
      const existingAccount = mockAccount();

      accountRepositoryMock.findOne.mockResolvedValue(existingAccount);
      accountRepositoryMock.save.mockResolvedValue(existingAccount);

      const result = await service.createOrUpdate(externalId, clientId, data);

      expect(accountRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { externalId, clientId },
      });
      expect(accountRepositoryMock.create).not.toHaveBeenCalled();
      expect(accountRepositoryMock.save).toHaveBeenCalledWith(existingAccount);
      expect(result.status).toBe(data.status);
    });
  });

  describe('findById', () => {
    it('should return account when found', async () => {
      const account = mockAccount();
      accountRepositoryMock.findOne.mockResolvedValue(account);

      const result = await service.findById(account.id);

      expect(accountRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: account.id },
        relations: ['onboarding'],
      });
      expect(result).toEqual(account);
    });

    it('should return null when account not found', async () => {
      accountRepositoryMock.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByNumber', () => {
    it('should return account when number found', async () => {
      const account = mockAccount();
      accountRepositoryMock.findOne.mockResolvedValue(account);

      const result = await service.findByNumber(account.number);

      expect(accountRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { number: account.number },
        relations: ['onboarding'],
      });
      expect(result).toEqual(account);
    });
  });

  describe('findByOnboardingDocument', () => {
    it('should return account when document matches', async () => {
      const account = mockAccount();
      const document = '12345678900';
      accountRepositoryMock.findOne.mockResolvedValue(account);

      const result = await service.findByOnboardingDocument(document);

      expect(accountRepositoryMock.findOne).toHaveBeenCalledWith({
        relations: ['onboarding'],
        where: {
          onboarding: {
            documentNumber: document,
          },
        },
      });
      expect(result).toEqual(account);
    });
  });

  describe('validateAccountBelongsToClient', () => {
    it('should not throw when account belongs to client', async () => {
      const accountId = 'uuid-account-1';
      const clientId = 'uuid-client-1';
      const account = mockAccount();

      accountRepositoryMock.findOne.mockResolvedValue(account);

      await expect(
        service.validateAccountBelongsToClient(accountId, clientId),
      ).resolves.not.toThrow();
    });

    it('should throw CustomHttpException when account does not belong to client', async () => {
      const accountId = 'uuid-account-1';
      const clientId = 'uuid-client-99';

      accountRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.validateAccountBelongsToClient(accountId, clientId);
        fail('Should have thrown CustomHttpException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(CustomHttpException);
        expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
        expect(error.errorCode).toBe(
          ErrorCode.ACCOUNT_DOES_NOT_BELONG_TO_CLIENT,
        );
      }
    });
  });
});
