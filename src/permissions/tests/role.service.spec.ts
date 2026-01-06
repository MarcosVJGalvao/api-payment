import { HttpStatus } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { createRoleServiceTestFactory } from './factory/role.service.factory';
import {
  mockCreateRoleDto,
  mockUpdateRoleDto,
  mockUpdateRolePermissionsDto,
  mockQueryRoleDto,
  mockRole,
  mockRoleWithPermissions,
  mockRoleWithUsers,
  mockPaginationResult,
  mockRolePermission,
  mockUserRole,
} from './mocks/role.mock';
import { mockPermission } from './mocks/permission.mock';
import { mockUserWithEmployee } from '@/user/tests/mocks/user.mock';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import * as permissionFinderHelper from '../helpers/permission-finder.helper';
import * as tokenHelper from '@/auth/helpers/token.helper';

jest.mock('../helpers/permission-finder.helper');
jest.mock('@/auth/helpers/token.helper');

describe('RoleService', () => {
  let service: RoleService;
  let roleRepositoryMock: any;
  let permissionRepositoryMock: any;
  let rolePermissionRepositoryMock: any;
  let userRepositoryMock: any;
  let userRoleRepositoryMock: any;
  let permissionServiceMock: any;
  let redisServiceMock: any;
  let baseQueryServiceMock: any;

  beforeEach(async () => {
    const factory = await createRoleServiceTestFactory();
    service = factory.roleService;
    roleRepositoryMock = factory.roleRepositoryMock;
    permissionRepositoryMock = factory.permissionRepositoryMock;
    rolePermissionRepositoryMock = factory.rolePermissionRepositoryMock;
    userRepositoryMock = factory.userRepositoryMock;
    userRoleRepositoryMock = factory.userRoleRepositoryMock;
    permissionServiceMock = factory.permissionServiceMock;
    redisServiceMock = factory.redisServiceMock;
    baseQueryServiceMock = factory.baseQueryServiceMock;

    jest
      .spyOn(permissionFinderHelper, 'findPermissions')
      .mockResolvedValue([mockPermission()]);

    (tokenHelper.revokeAllUserTokens as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    it('should successfully create a role', async () => {
      const createDto = mockCreateRoleDto();
      const role = mockRole();
      const roleWithPermissions = mockRoleWithPermissions();
      const permissions = [mockPermission()];

      roleRepositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(roleWithPermissions);
      jest
        .spyOn(permissionFinderHelper, 'findPermissions')
        .mockResolvedValue(permissions);
      roleRepositoryMock.create.mockReturnValue(role);
      roleRepositoryMock.save.mockResolvedValue(role);
      rolePermissionRepositoryMock.create.mockReturnValue(mockRolePermission());
      rolePermissionRepositoryMock.save.mockResolvedValue([
        mockRolePermission(),
      ]);

      const result = await service.createRole(createDto);

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(permissionFinderHelper.findPermissions).toHaveBeenCalledWith(
        permissionRepositoryMock,
        createDto.permissionNames,
        createDto.permissionIds,
      );
      expect(roleRepositoryMock.create).toHaveBeenCalled();
      expect(roleRepositoryMock.save).toHaveBeenCalledWith(role);
      expect(rolePermissionRepositoryMock.create).toHaveBeenCalled();
      expect(rolePermissionRepositoryMock.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw CustomHttpException when role already exists', async () => {
      const createDto = mockCreateRoleDto();
      const existingRole = mockRole();

      roleRepositoryMock.findOne.mockResolvedValue(existingRole);

      try {
        await service.createRole(createDto);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(err.errorCode).toBe(ErrorCode.ROLE_ALREADY_EXISTS);
        expect(err.customMessage).toContain('Role already exists');
      }

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(roleRepositoryMock.create).not.toHaveBeenCalled();
      expect(roleRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('assignRoleToUser', () => {
    it('should successfully assign role to user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const user = mockUserWithEmployee();
      const role = mockRole();
      const userRole = mockUserRole();

      userRepositoryMock.findOne.mockResolvedValue(user);
      roleRepositoryMock.findOne.mockResolvedValue(role);
      userRoleRepositoryMock.findOne.mockResolvedValue(null);
      userRoleRepositoryMock.create.mockReturnValue(userRole);
      userRoleRepositoryMock.save.mockResolvedValue(userRole);
      permissionServiceMock.invalidateUserCache.mockResolvedValue(undefined);

      await service.assignRoleToUser(userId, roleId);

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
      });
      expect(userRoleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          role: { id: roleId },
        },
        withDeleted: true,
      });
      expect(userRoleRepositoryMock.create).toHaveBeenCalled();
      expect(userRoleRepositoryMock.save).toHaveBeenCalled();
      expect(permissionServiceMock.invalidateUserCache).toHaveBeenCalledWith(
        userId,
      );
      expect(tokenHelper.revokeAllUserTokens).toHaveBeenCalledWith(
        redisServiceMock,
        userId,
      );
    });

    it('should not assign role if user already has it', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const user = mockUserWithEmployee();
      const role = mockRole();
      const existingUserRole = mockUserRole();
      (existingUserRole as any).deletedAt = null;

      userRepositoryMock.findOne.mockResolvedValue(user);
      roleRepositoryMock.findOne.mockResolvedValue(role);
      userRoleRepositoryMock.findOne.mockResolvedValue(existingUserRole);

      await service.assignRoleToUser(userId, roleId);

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRoleRepositoryMock.create).not.toHaveBeenCalled();
      expect(userRoleRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should restore role if user had it but was deleted', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const user = mockUserWithEmployee();
      const role = mockRole();
      const existingUserRole = mockUserRole();
      existingUserRole.deletedAt = new Date();

      userRepositoryMock.findOne.mockResolvedValue(user);
      roleRepositoryMock.findOne.mockResolvedValue(role);
      userRoleRepositoryMock.findOne.mockResolvedValue(existingUserRole);
      userRoleRepositoryMock.save.mockResolvedValue(existingUserRole);
      permissionServiceMock.invalidateUserCache.mockResolvedValue(undefined);

      await service.assignRoleToUser(userId, roleId);

      expect(userRoleRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: null,
        }),
      );
      expect(permissionServiceMock.invalidateUserCache).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should throw CustomHttpException when user is not found', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';

      userRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.assignRoleToUser(userId, roleId);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.USER_NOT_FOUND);
        expect(err.customMessage).toContain('User not found');
      }

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(roleRepositoryMock.findOne).not.toHaveBeenCalled();
    });

    it('should throw CustomHttpException when role is not found', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const user = mockUserWithEmployee();

      userRepositoryMock.findOne.mockResolvedValue(user);
      roleRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.assignRoleToUser(userId, roleId);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.ROLE_NOT_FOUND);
        expect(err.customMessage).toContain('Role not found');
      }

      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
      });
      expect(userRoleRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('removeRoleFromUser', () => {
    it('should successfully remove role from user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const userRole = mockUserRole();
      (userRole as any).deletedAt = null;

      userRoleRepositoryMock.findOne.mockResolvedValue(userRole);
      userRoleRepositoryMock.save.mockResolvedValue(userRole);
      permissionServiceMock.invalidateUserCache.mockResolvedValue(undefined);

      await service.removeRoleFromUser(userId, roleId);

      expect(userRoleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          role: { id: roleId },
        },
      });
      expect(userRoleRepositoryMock.save).toHaveBeenCalled();
      expect(permissionServiceMock.invalidateUserCache).toHaveBeenCalledWith(
        userId,
      );
      expect(tokenHelper.revokeAllUserTokens).toHaveBeenCalledWith(
        redisServiceMock,
        userId,
      );
    });

    it('should return early if user role does not exist', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';

      userRoleRepositoryMock.findOne.mockResolvedValue(null);

      await service.removeRoleFromUser(userId, roleId);

      expect(userRoleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          role: { id: roleId },
        },
      });
      expect(userRoleRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should return early if user role is already deleted', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const userRole = mockUserRole();
      userRole.deletedAt = new Date();

      userRoleRepositoryMock.findOne.mockResolvedValue(userRole);

      await service.removeRoleFromUser(userId, roleId);

      expect(userRoleRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const userRole = mockUserRole();
      const role = mockRoleWithPermissions();
      userRole.role = role;
      (userRole as any).deletedAt = null;

      userRoleRepositoryMock.find.mockResolvedValue([userRole]);

      const result = await service.getUserRoles(userId);

      expect(userRoleRepositoryMock.find).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
        },
        relations: { role: { rolePermissions: { permission: true } } },
      });
      expect(result).toEqual([role]);
    });

    it('should return empty array when user has no roles', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';

      userRoleRepositoryMock.find.mockResolvedValue([]);

      const result = await service.getUserRoles(userId);

      expect(result).toEqual([]);
    });

    it('should filter out deleted user roles', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const userRole = mockUserRole();
      userRole.deletedAt = new Date();

      userRoleRepositoryMock.find.mockResolvedValue([userRole]);

      const result = await service.getUserRoles(userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateRolePermissions', () => {
    it('should successfully update role permissions', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const updateDto = mockUpdateRolePermissionsDto();
      const role = mockRoleWithUsers();
      const permissions = [mockPermission()];
      const roleWithPermissions = mockRoleWithPermissions();

      roleRepositoryMock.findOne
        .mockResolvedValueOnce(role)
        .mockResolvedValueOnce(roleWithPermissions);
      jest
        .spyOn(permissionFinderHelper, 'findPermissions')
        .mockResolvedValue(permissions);
      rolePermissionRepositoryMock.save.mockResolvedValue([
        mockRolePermission(),
      ]);
      permissionServiceMock.invalidateUserCache.mockResolvedValue(undefined);

      const result = await service.updateRolePermissions(roleId, updateDto);

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: {
          rolePermissions: { permission: true },
          userRoles: { user: true },
        },
      });
      expect(permissionFinderHelper.findPermissions).toHaveBeenCalledWith(
        permissionRepositoryMock,
        updateDto.permissionNames,
        updateDto.permissionIds,
      );
      expect(rolePermissionRepositoryMock.save).toHaveBeenCalled();
      expect(permissionServiceMock.invalidateUserCache).toHaveBeenCalled();
      expect(tokenHelper.revokeAllUserTokens).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw CustomHttpException when role is not found', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const updateDto = mockUpdateRolePermissionsDto();

      roleRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.updateRolePermissions(roleId, updateDto);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.ROLE_NOT_FOUND);
        expect(err.customMessage).toContain('Role not found');
      }

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: {
          rolePermissions: { permission: true },
          userRoles: { user: true },
        },
      });
      expect(rolePermissionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should successfully update role name and description', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const updateDto = mockUpdateRoleDto();
      const role = mockRole();
      const roleWithPermissions = mockRoleWithPermissions();

      roleRepositoryMock.findOne
        .mockResolvedValueOnce(role)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(roleWithPermissions);
      roleRepositoryMock.save.mockResolvedValue(role);

      await service.updateRole(roleId, updateDto);

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
      });
      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: { rolePermissions: { permission: true } },
      });
      expect(roleRepositoryMock.save).toHaveBeenCalled();
    });

    it('should throw CustomHttpException when role name already exists', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const updateDto = mockUpdateRoleDto();
      const role = mockRole();
      const existingRole = mockRole();
      existingRole.id = 'different-id';

      roleRepositoryMock.findOne
        .mockResolvedValueOnce(role)
        .mockResolvedValueOnce(existingRole);

      try {
        await service.updateRole(roleId, updateDto);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(err.errorCode).toBe(ErrorCode.ROLE_ALREADY_EXISTS);
        expect(err.customMessage).toContain('Role name already exists');
      }

      expect(roleRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should throw CustomHttpException when role is not found', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const updateDto = mockUpdateRoleDto();

      roleRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.updateRole(roleId, updateDto);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.ROLE_NOT_FOUND);
        expect(err.customMessage).toContain('Role not found');
      }

      expect(roleRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    it('should successfully delete a role', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const role = mockRole();
      role.userRoles = [];

      roleRepositoryMock.findOne.mockResolvedValue(role);
      roleRepositoryMock.remove.mockResolvedValue(role);

      await service.deleteRole(roleId);

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: { userRoles: { user: true } },
      });
      expect(roleRepositoryMock.remove).toHaveBeenCalledWith(role);
    });

    it('should invalidate user cache when role has users', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const role = mockRoleWithUsers();

      roleRepositoryMock.findOne.mockResolvedValue(role);
      permissionServiceMock.invalidateUserCache.mockResolvedValue(undefined);
      roleRepositoryMock.remove.mockResolvedValue(role);

      await service.deleteRole(roleId);

      expect(permissionServiceMock.invalidateUserCache).toHaveBeenCalled();
      expect(tokenHelper.revokeAllUserTokens).toHaveBeenCalled();
      expect(roleRepositoryMock.remove).toHaveBeenCalledWith(role);
    });

    it('should throw CustomHttpException when role is not found', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';

      roleRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.deleteRole(roleId);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.ROLE_NOT_FOUND);
        expect(err.customMessage).toContain('Role not found');
      }

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: { userRoles: { user: true } },
      });
      expect(roleRepositoryMock.remove).not.toHaveBeenCalled();
    });
  });

  describe('getAllRoles', () => {
    it('should return paginated roles', async () => {
      const queryDto = mockQueryRoleDto();
      const mockQueryOptions = {
        page: 1,
        limit: 10,
      };
      const mockResult = mockPaginationResult();

      baseQueryServiceMock.buildQueryOptions.mockReturnValue(mockQueryOptions);
      baseQueryServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await service.getAllRoles(queryDto);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalledWith(
        roleRepositoryMock,
        queryDto,
        expect.objectContaining({
          relations: ['rolePermissions', 'rolePermissions.permission'],
          defaultSortBy: 'name',
          searchFields: ['name', 'description'],
        }),
      );
      expect(baseQueryServiceMock.findAll).toHaveBeenCalledWith(
        roleRepositoryMock,
        mockQueryOptions,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getRoleById', () => {
    it('should return role by id', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const role = mockRoleWithPermissions();

      roleRepositoryMock.findOne.mockResolvedValue(role);

      const result = await service.getRoleById(roleId);

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: { rolePermissions: { permission: true } },
      });
      expect(result).toEqual(role);
    });

    it('should throw CustomHttpException when role is not found', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';

      roleRepositoryMock.findOne.mockResolvedValue(null);

      try {
        await service.getRoleById(roleId);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.ROLE_NOT_FOUND);
        expect(err.customMessage).toContain('Role not found');
      }

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: { rolePermissions: { permission: true } },
      });
    });
  });
});
