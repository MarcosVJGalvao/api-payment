import { HttpStatus } from '@nestjs/common';
import { BackofficeUserService } from '../../services/backoffice-user.service';
import { createBackofficeUserServiceTestFactory } from '../factory/backoffice-user.service.factory';
import {
  mockBackofficeUser,
  mockCreateBackofficeUserDto,
} from '../mocks/backoffice-user.mock';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('BackofficeUserService', () => {
  let service: BackofficeUserService;
  let repositoryMock: any;
  let loggerMock: any;

  beforeEach(async () => {
    const factory = await createBackofficeUserServiceTestFactory();
    service = factory.backofficeUserService;
    repositoryMock = factory.backofficeUserRepositoryMock;
    loggerMock = factory.loggerMock;

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_value');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a backoffice user', async () => {
      const dto = mockCreateBackofficeUserDto();
      const clientId = 'uuid-client-1';
      const createdUser = mockBackofficeUser();

      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.create.mockReturnValue(createdUser);
      repositoryMock.save.mockResolvedValue(createdUser);

      const result = await service.create(dto, clientId);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: dto.email, clientId },
      });
      expect(repositoryMock.create).toHaveBeenCalled();
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledTimes(2); // Password and secret answer
      expect(result).toEqual(createdUser);
    });

    it('should throw CustomHttpException when user already exists', async () => {
      const dto = mockCreateBackofficeUserDto();
      const clientId = 'uuid-client-1';
      const existingUser = mockBackofficeUser();

      repositoryMock.findOne.mockResolvedValue(existingUser);

      try {
        await service.create(dto, clientId);
        fail('Should have thrown CustomHttpException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(CustomHttpException);
        expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(error.errorCode).toBe(ErrorCode.USER_ALREADY_EXISTS);
      }

      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const user = mockBackofficeUser();
      repositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(user.email);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: user.email },
      });
      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = mockBackofficeUser();
      repositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findById(user.id);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
      });
      expect(result).toEqual(user);
    });
  });

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      const userId = 'uuid-user-1';
      const newPassword = 'newPassword123';

      repositoryMock.update.mockResolvedValue({ affected: 1 });

      await service.updatePassword(userId, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(repositoryMock.update).toHaveBeenCalledWith(userId, {
        password: 'hashed_value',
      });
      expect(loggerMock.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully soft delete user', async () => {
      const userId = 'uuid-user-1';

      repositoryMock.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(userId);

      expect(repositoryMock.softDelete).toHaveBeenCalledWith(userId);
      expect(loggerMock.log).toHaveBeenCalled();
    });
  });
});
