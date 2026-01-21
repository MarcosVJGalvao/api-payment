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
  mockPaginationResult,
  mockRolePermission,
} from './mocks/role.mock';
import { mockPermission } from './mocks/permission.mock';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import * as permissionFinderHelper from '../helpers/permission-finder.helper';

jest.mock('../helpers/permission-finder.helper');

describe('RoleService', () => {
  let service: RoleService;
  let roleRepositoryMock: any;
  let permissionRepositoryMock: any;
  let rolePermissionRepositoryMock: any;
  let baseQueryServiceMock: any;

  beforeEach(async () => {
    const factory = await createRoleServiceTestFactory();
    service = factory.roleService;
    roleRepositoryMock = factory.roleRepositoryMock;
    permissionRepositoryMock = factory.permissionRepositoryMock;
    rolePermissionRepositoryMock = factory.rolePermissionRepositoryMock;
    baseQueryServiceMock = factory.baseQueryServiceMock;

    jest
      .spyOn(permissionFinderHelper, 'findPermissions')
      .mockResolvedValue([mockPermission()]);
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
    it('should throw NOT_IMPLEMENTED error (placeholder implementation)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';

      try {
        await service.assignRoleToUser(userId, roleId);
        fail('Should have thrown CustomHttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(CustomHttpException);
        expect(err.getStatus()).toBe(HttpStatus.NOT_IMPLEMENTED);
        expect(err.errorCode).toBe(ErrorCode.FEATURE_NOT_IMPLEMENTED);
      }
    });
  });

  describe('removeRoleFromUser', () => {
    it('should return without error (placeholder implementation)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';
      const roleId = '550e8400-e29b-41d4-a716-446655440030';

      await expect(
        service.removeRoleFromUser(userId, roleId),
      ).resolves.toBeUndefined();
    });
  });

  describe('getUserRoles', () => {
    it('should return empty array (placeholder implementation)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440010';

      const result = await service.getUserRoles(userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateRolePermissions', () => {
    it('should successfully update role permissions', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440030';
      const updateDto = mockUpdateRolePermissionsDto();
      const role = mockRoleWithPermissions();
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

      const result = await service.updateRolePermissions(roleId, updateDto);

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        relations: {
          rolePermissions: { permission: true },
        },
      });
      expect(permissionFinderHelper.findPermissions).toHaveBeenCalledWith(
        permissionRepositoryMock,
        updateDto.permissionNames,
        updateDto.permissionIds,
      );
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

      roleRepositoryMock.findOne.mockResolvedValue(role);
      roleRepositoryMock.remove.mockResolvedValue(role);

      await service.deleteRole(roleId);

      expect(roleRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
      });
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
