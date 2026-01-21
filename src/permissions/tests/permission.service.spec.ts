import { HttpStatus } from '@nestjs/common';
import { PermissionService } from '../services/permission.service';
import { createPermissionServiceTestFactory } from './factory/permission.service.factory';
import { PermissionName } from '../enums/permission-name.enum';
import {
  mockCreatePermissionDto,
  mockUpdatePermissionDto,
  mockQueryPermissionDto,
  mockPermission,
  mockPermissionWithRoles,
  mockPaginationResult,
  mockRolePermission,
  mockRole,
} from './mocks/permission.mock';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import * as permissionHelper from '../helpers/permission.helper';

jest.mock('../helpers/permission.helper');

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionRepositoryMock: any;
  let redisServiceMock: any;
  let configServiceMock: any;
  let baseQueryServiceMock: any;

  beforeEach(async () => {
    const factory = await createPermissionServiceTestFactory();
    service = factory.permissionService;
    permissionRepositoryMock = factory.permissionRepositoryMock;
    redisServiceMock = factory.redisServiceMock;
    configServiceMock = factory.configServiceMock;
    baseQueryServiceMock = factory.baseQueryServiceMock;

    configServiceMock.get.mockImplementation(
      (key: string, defaultValue?: any) => {
        if (key === 'REDIS_TTL') {
          return 3600;
        }
        return defaultValue;
      },
    );

    (permissionHelper.checkPermissionHierarchy as jest.Mock) = jest
      .fn()
      .mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return empty array (placeholder implementation)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';

      const result = await service.getUserPermissions(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserRoles', () => {
    it('should return empty array (placeholder implementation)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';

      const result = await service.getUserRoles(userId);

      expect(result).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should return true when checkPermissionHierarchy returns true', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const requiredPermission = PermissionName.USER_READ;

      (permissionHelper.checkPermissionHierarchy as jest.Mock).mockReturnValue(
        true,
      );

      const result = await service.hasPermission(userId, requiredPermission);

      expect(permissionHelper.checkPermissionHierarchy).toHaveBeenCalledWith(
        [],
        requiredPermission,
      );
      expect(result).toBe(true);
    });

    it('should return false when checkPermissionHierarchy returns false', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const requiredPermission = PermissionName.USER_DELETE;

      (permissionHelper.checkPermissionHierarchy as jest.Mock).mockReturnValue(
        false,
      );

      const result = await service.hasPermission(userId, requiredPermission);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const permissions = [
        PermissionName.USER_READ,
        PermissionName.USER_DELETE,
      ];

      jest
        .spyOn(service, 'hasPermission')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.hasAnyPermission(userId, permissions);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const permissions = [
        PermissionName.USER_DELETE,
        PermissionName.USER_UPDATE,
      ];

      jest
        .spyOn(service, 'hasPermission')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      const result = await service.hasAnyPermission(userId, permissions);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const permissions = [
        PermissionName.USER_READ,
        PermissionName.USER_UPDATE,
      ];

      jest
        .spyOn(service, 'hasPermission')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const result = await service.hasAllPermissions(userId, permissions);

      expect(result).toBe(true);
    });

    it('should return false when user does not have all permissions', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const permissions = [
        PermissionName.USER_READ,
        PermissionName.USER_DELETE,
      ];

      jest
        .spyOn(service, 'hasPermission')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.hasAllPermissions(userId, permissions);

      expect(result).toBe(false);
    });
  });

  describe('invalidateUserCache', () => {
    it('should delete user permissions and roles cache', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';

      redisServiceMock.del.mockResolvedValue(undefined);

      await service.invalidateUserCache(userId);

      expect(redisServiceMock.del).toHaveBeenCalledWith(
        `user_permissions:${userId}`,
      );
      expect(redisServiceMock.del).toHaveBeenCalledWith(`user_roles:${userId}`);
    });
  });

  describe('getAllPermissions', () => {
    it('should return paginated permissions', async () => {
      const queryDto = mockQueryPermissionDto();
      const mockQueryOptions = {
        page: 1,
        limit: 10,
      };
      const mockResult = mockPaginationResult();

      baseQueryServiceMock.buildQueryOptions.mockReturnValue(mockQueryOptions);
      baseQueryServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await service.getAllPermissions(queryDto);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalledWith(
        permissionRepositoryMock,
        queryDto,
        expect.objectContaining({
          relations: ['rolePermissions', 'rolePermissions.role'],
          defaultSortBy: 'module',
          searchFields: ['name', 'module', 'action', 'description'],
        }),
      );
      expect(baseQueryServiceMock.findAll).toHaveBeenCalledWith(
        permissionRepositoryMock,
        mockQueryOptions,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPermissionById', () => {
    it('should return permission by id', async () => {
      const permissionId = '550e8400-e29b-41d4-a716-446655440020';
      const permission = mockPermissionWithRoles();

      permissionRepositoryMock.findOne.mockResolvedValue(permission);

      const result = await service.getPermissionById(permissionId);

      expect(permissionRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: permissionId },
        relations: { rolePermissions: { role: true } },
      });
      expect(result).toEqual(permission);
    });

    it('should throw CustomHttpException when permission is not found', async () => {
      const permissionId = '550e8400-e29b-41d4-a716-446655440020';

      permissionRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.getPermissionById(permissionId);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.PERMISSION_NOT_FOUND);
        expect(err.customMessage).toContain('Permission not found');
      }

      expect(permissionRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: permissionId },
        relations: { rolePermissions: { role: true } },
      });
    });
  });

  describe('createPermission', () => {
    it('should successfully create a permission', async () => {
      const createDto = mockCreatePermissionDto();
      const permission = mockPermission();

      permissionRepositoryMock.findOne.mockResolvedValue(null);
      permissionRepositoryMock.create.mockReturnValue(permission);
      permissionRepositoryMock.save.mockResolvedValue(permission);

      const result = await service.createPermission(createDto);

      expect(permissionRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(permissionRepositoryMock.create).toHaveBeenCalledWith(createDto);
      expect(permissionRepositoryMock.save).toHaveBeenCalledWith(permission);
      expect(result).toEqual(permission);
    });

    it('should throw CustomHttpException when permission already exists', async () => {
      const createDto = mockCreatePermissionDto();
      const existingPermission = mockPermission();

      permissionRepositoryMock.findOne.mockResolvedValue(existingPermission);

      try {
        await service.createPermission(createDto);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(err.errorCode).toBe(ErrorCode.PERMISSION_ALREADY_EXISTS);
        expect(err.customMessage).toContain('Permission already exists');
      }

      expect(permissionRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(permissionRepositoryMock.create).not.toHaveBeenCalled();
      expect(permissionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('updatePermission', () => {
    it('should successfully update a permission', async () => {
      const permissionId = '550e8400-e29b-41d4-a716-446655440020';
      const updateDto = mockUpdatePermissionDto();
      const permission = mockPermission();

      permissionRepositoryMock.findOne.mockResolvedValue(permission);
      permissionRepositoryMock.save.mockResolvedValue(permission);

      const result = await service.updatePermission(permissionId, updateDto);

      expect(permissionRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
      expect(permissionRepositoryMock.save).toHaveBeenCalled();
      expect(result).toEqual(permission);
    });

    it('should throw CustomHttpException when permission is not found', async () => {
      const permissionId = '550e8400-e29b-41d4-a716-446655440020';
      const updateDto = mockUpdatePermissionDto();

      permissionRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.updatePermission(permissionId, updateDto);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.PERMISSION_NOT_FOUND);
        expect(err.customMessage).toContain('Permission not found');
      }

      expect(permissionRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
      expect(permissionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('deletePermission', () => {
    it('should successfully delete a permission', async () => {
      const permissionId = '550e8400-e29b-41d4-a716-446655440020';
      const permission = mockPermissionWithRoles();
      permission.rolePermissions = [];

      permissionRepositoryMock.findOne.mockResolvedValue(permission);
      permissionRepositoryMock.remove.mockResolvedValue(permission);

      await service.deletePermission(permissionId);

      expect(permissionRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: permissionId },
        relations: {
          rolePermissions: { role: true },
        },
      });
      expect(permissionRepositoryMock.remove).toHaveBeenCalledWith(permission);
    });

    it('should successfully delete a permission with roles', async () => {
      const permissionId = '550e8400-e29b-41d4-a716-446655440020';
      const permission = mockPermissionWithRoles();
      const rolePermission = mockRolePermission();
      rolePermission.role = mockRole();
      permission.rolePermissions = [rolePermission];

      permissionRepositoryMock.findOne.mockResolvedValue(permission);
      permissionRepositoryMock.remove.mockResolvedValue(permission);

      await service.deletePermission(permissionId);

      expect(permissionRepositoryMock.remove).toHaveBeenCalledWith(permission);
    });

    it('should throw CustomHttpException when permission is not found', async () => {
      const permissionId = '550e8400-e29b-41d4-a716-446655440020';

      permissionRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.deletePermission(permissionId);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.PERMISSION_NOT_FOUND);
        expect(err.customMessage).toContain('Permission not found');
      }

      expect(permissionRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: permissionId },
        relations: {
          rolePermissions: { role: true },
        },
      });
      expect(permissionRepositoryMock.remove).not.toHaveBeenCalled();
    });
  });
});
