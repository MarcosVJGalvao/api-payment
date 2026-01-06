import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoleService } from '../../services/role.service';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/user-role.entity';
import { PermissionService } from '../../services/permission.service';
import { RedisService } from '@/common/redis/redis.service';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

export const createRoleServiceTestFactory = async () => {
  const permissionServiceMock = {
    invalidateUserCache: jest.fn(),
  };

  const redisServiceMock = {
    keys: jest.fn(),
    mget: jest.fn(),
    del: jest.fn(),
  };

  const baseQueryServiceMock = {
    buildQueryOptions: jest.fn(),
    findAll: jest.fn(),
  };

  const module = await Test.createTestingModule({
    providers: [
      RoleService,
      {
        provide: getRepositoryToken(Role),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(Permission),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(RolePermission),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(User),
        useValue: mockRepository(),
      },
      {
        provide: getRepositoryToken(UserRole),
        useValue: mockRepository(),
      },
      {
        provide: PermissionService,
        useValue: permissionServiceMock,
      },
      {
        provide: RedisService,
        useValue: redisServiceMock,
      },
      {
        provide: BaseQueryService,
        useValue: baseQueryServiceMock,
      },
    ],
  }).compile();

  return {
    roleService: module.get<RoleService>(RoleService),
    roleRepositoryMock: module.get(getRepositoryToken(Role)),
    permissionRepositoryMock: module.get(getRepositoryToken(Permission)),
    rolePermissionRepositoryMock: module.get(
      getRepositoryToken(RolePermission),
    ),
    userRepositoryMock: module.get(getRepositoryToken(User)),
    userRoleRepositoryMock: module.get(getRepositoryToken(UserRole)),
    permissionServiceMock,
    redisServiceMock,
    baseQueryServiceMock,
  };
};
