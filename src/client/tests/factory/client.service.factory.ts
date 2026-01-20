import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientService } from '../../client.service';
import { Client } from '../../entities/client.entity';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { PermissionService } from '@/permissions/services/permission.service';

export type ClientServiceTestFactory = {
  clientService: ClientService;
  clientRepositoryMock: Record<string, jest.Mock>;
  baseQueryServiceMock: Record<string, jest.Mock>;
  permissionServiceMock: Record<string, jest.Mock>;
};

export const createClientServiceTestFactory =
  async (): Promise<ClientServiceTestFactory> => {
    const clientRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    };

    const baseQueryServiceMock = {
      buildQueryOptions: jest.fn(),
      findAll: jest.fn(),
    };

    const permissionServiceMock = {
      assignPermissionsToClient: jest.fn(),
      updateClientPermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useValue: clientRepositoryMock,
        },
        {
          provide: BaseQueryService,
          useValue: baseQueryServiceMock,
        },
        {
          provide: PermissionService,
          useValue: permissionServiceMock,
        },
      ],
    }).compile();

    return {
      clientService: module.get<ClientService>(ClientService),
      clientRepositoryMock,
      baseQueryServiceMock,
      permissionServiceMock,
    };
  };
