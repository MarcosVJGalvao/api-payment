import { HttpStatus } from '@nestjs/common';
import { ClientService } from '../client.service';
import { createClientServiceTestFactory } from './factory/client.service.factory';
import {
  mockClient,
  mockCreateClientDto,
  mockUpdateClientDto,
  mockClientPaginationResult,
} from './mocks/client.mock';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

describe('ClientService', () => {
  let service: ClientService;
  let clientRepositoryMock: any;
  let baseQueryServiceMock: any;
  let permissionServiceMock: any;

  beforeEach(async () => {
    const factory = await createClientServiceTestFactory();
    service = factory.clientService;
    clientRepositoryMock = factory.clientRepositoryMock;
    baseQueryServiceMock = factory.baseQueryServiceMock;
    permissionServiceMock = factory.permissionServiceMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a client', async () => {
      const createDto = mockCreateClientDto();
      const client = mockClient();

      clientRepositoryMock.findOne.mockResolvedValue(null);
      clientRepositoryMock.create.mockReturnValue(client);
      clientRepositoryMock.save.mockResolvedValue(client);
      permissionServiceMock.assignPermissionsToClient.mockResolvedValue(
        undefined,
      );

      const result = await service.create(createDto);

      expect(clientRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { document: createDto.document },
        withDeleted: true,
      });
      expect(clientRepositoryMock.create).toHaveBeenCalled();
      expect(clientRepositoryMock.save).toHaveBeenCalled();
      expect(
        permissionServiceMock.assignPermissionsToClient,
      ).toHaveBeenCalledWith(client.id, createDto.scopes);
      expect(result).toEqual(client);
    });

    it('should throw CustomHttpException when client document already exists', async () => {
      const createDto = mockCreateClientDto();
      const existingClient = mockClient();

      clientRepositoryMock.findOne.mockResolvedValue(existingClient);

      try {
        await service.create(createDto);
        fail('Should have thrown CustomHttpException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(CustomHttpException);
        expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(error.errorCode).toBe(ErrorCode.CLIENT_ALREADY_EXISTS);
      }

      expect(clientRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated clients', async () => {
      const queryDto = {};
      const paginationResult = mockClientPaginationResult();

      baseQueryServiceMock.buildQueryOptions.mockReturnValue({});
      baseQueryServiceMock.findAll.mockResolvedValue(paginationResult);

      const result = await service.findAll(queryDto);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalled();
      expect(baseQueryServiceMock.findAll).toHaveBeenCalledWith(
        clientRepositoryMock,
        {},
      );
      expect(result).toEqual(paginationResult);
    });
  });

  describe('findById', () => {
    it('should return client when found', async () => {
      const client = mockClient();
      clientRepositoryMock.findOne.mockResolvedValue(client);

      const result = await service.findById(client.id);

      expect(clientRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: client.id },
      });
      expect(result).toEqual(client);
    });

    it('should throw CustomHttpException when client not found', async () => {
      clientRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.findById('non-existent-id');
        fail('Should have thrown CustomHttpException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(CustomHttpException);
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(error.errorCode).toBe(ErrorCode.CLIENT_NOT_FOUND);
      }
    });
  });

  describe('update', () => {
    it('should successfully update a client', async () => {
      const client = mockClient();
      const updateDto = mockUpdateClientDto();

      clientRepositoryMock.findOne.mockResolvedValue(client);
      clientRepositoryMock.save.mockResolvedValue({ ...client, ...updateDto });
      permissionServiceMock.updateClientPermissions.mockResolvedValue(
        undefined,
      );

      const result = await service.update(client.id, updateDto);

      expect(clientRepositoryMock.findOne).toHaveBeenCalled();
      expect(clientRepositoryMock.save).toHaveBeenCalled();
      expect(
        permissionServiceMock.updateClientPermissions,
      ).toHaveBeenCalledWith(client.id, updateDto.scopes);
      expect(result.name).toBe(updateDto.name);
    });
  });

  describe('remove', () => {
    it('should successfully soft remove a client', async () => {
      const client = mockClient();
      clientRepositoryMock.findOne.mockResolvedValue(client);
      clientRepositoryMock.softRemove.mockResolvedValue(client);

      await service.remove(client.id);

      expect(clientRepositoryMock.findOne).toHaveBeenCalled();
      expect(clientRepositoryMock.softRemove).toHaveBeenCalledWith(client);
    });
  });
});
