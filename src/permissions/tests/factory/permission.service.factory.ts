import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '../../services/permission.service';
import { Permission } from '../../entities/permission.entity';
import { Role } from '../../entities/role.entity';
import { ClientRole } from '../../entities/client-role.entity';
import { ClientPermission } from '../../entities/client-permission.entity';
import { RedisService } from '@/common/redis/redis.service';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

export const createPermissionServiceTestFactory = async () => {
  const redisServiceMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const baseQueryServiceMock = {
    buildQueryOptions: jest.fn(),
    findAll: jest.fn(),
  };

  const module = await Test.createTestingModule({
    providers: [
      PermissionService,
      {
        provide: getRepositoryToken(Permission),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(Role),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(ClientRole),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(ClientPermission),
        useValue: mockRepository(),
      },
      {
        provide: RedisService,
        useValue: redisServiceMock,
      },
      {
        provide: ConfigService,
        useValue: configServiceMock,
      },
      {
        provide: BaseQueryService,
        useValue: baseQueryServiceMock,
      },
    ],
  }).compile();

  return {
    permissionService: module.get<PermissionService>(PermissionService),
    permissionRepositoryMock: module.get(getRepositoryToken(Permission)),
    roleRepositoryMock: module.get(getRepositoryToken(Role)),
    redisServiceMock,
    configServiceMock,
    baseQueryServiceMock,
  };
};
