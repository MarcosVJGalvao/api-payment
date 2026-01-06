import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '../../services/permission.service';
import { Permission } from '../../entities/permission.entity';
import { Role } from '../../entities/role.entity';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/user-role.entity';
import { UserPermission } from '@/user/entities/user-permission.entity';
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
        provide: getRepositoryToken(User),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(Permission),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(Role),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(UserRole),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(UserPermission),
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
    userRepositoryMock: module.get(getRepositoryToken(User)),
    permissionRepositoryMock: module.get(getRepositoryToken(Permission)),
    roleRepositoryMock: module.get(getRepositoryToken(Role)),
    userRoleRepositoryMock: module.get(getRepositoryToken(UserRole)),
    userPermissionRepositoryMock: module.get(
      getRepositoryToken(UserPermission),
    ),
    redisServiceMock,
    configServiceMock,
    baseQueryServiceMock,
  };
};
