import { CreateRoleDto } from '../../dto/create-role.dto';
import { UpdateRoleDto } from '../../dto/update-role.dto';
import { UpdateRolePermissionsDto } from '../../dto/update-role-permissions.dto';
import { QueryRoleDto } from '../../dto/query-role.dto';
import { Role } from '../../entities/role.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { UserRole } from '@/user/entities/user-role.entity';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { mockUserWithEmployee } from '@/user/tests/mocks/user.mock';
import { mockPermission } from './permission.mock';

export const mockCreateRoleDto = (): CreateRoleDto => ({
  name: 'manager',
  description: 'Role para gerentes',
  permissionIds: ['550e8400-e29b-41d4-a716-446655440020'],
});

export const mockUpdateRoleDto = (): UpdateRoleDto => ({
  name: 'manager_updated',
  description: 'Role atualizada para gerentes',
});

export const mockUpdateRolePermissionsDto = (): UpdateRolePermissionsDto => ({
  permissionIds: ['550e8400-e29b-41d4-a716-446655440020'],
});

export const mockQueryRoleDto = (): QueryRoleDto => ({
  page: 1,
  limit: 10,
  name: 'manager',
});

export const mockRole = (): Role => {
  const role = new Role();
  role.id = '550e8400-e29b-41d4-a716-446655440030';
  role.name = 'manager';
  role.description = 'Role para gerentes';
  role.createdAt = new Date('2024-01-01T00:00:00.000Z');
  role.updatedAt = new Date('2024-01-01T00:00:00.000Z');
  (role as any).deletedAt = null;
  return role;
};

export const mockRolePermission = (): RolePermission => {
  const rolePermission = new RolePermission();
  rolePermission.id = '550e8400-e29b-41d4-a716-446655440040';
  rolePermission.role = mockRole();
  rolePermission.permission = mockPermission();
  rolePermission.createdAt = new Date('2024-01-01T00:00:00.000Z');
  rolePermission.updatedAt = new Date('2024-01-01T00:00:00.000Z');
  (rolePermission as any).deletedAt = null;
  return rolePermission;
};

export const mockRoleWithPermissions = (): Role => {
  const role = mockRole();
  const rolePermission = mockRolePermission();
  rolePermission.role = role;
  role.rolePermissions = [rolePermission];
  return role;
};

export const mockUserRole = (): UserRole => {
  const userRole = new UserRole();
  userRole.id = '550e8400-e29b-41d4-a716-446655440050';
  userRole.user = mockUserWithEmployee();
  userRole.role = mockRole();
  userRole.createdAt = new Date('2024-01-01T00:00:00.000Z');
  userRole.updatedAt = new Date('2024-01-01T00:00:00.000Z');
  (userRole as any).deletedAt = null;
  return userRole;
};

export const mockRoleWithUsers = (): Role => {
  const role = mockRole();
  const userRole = mockUserRole();
  userRole.role = role;
  role.userRoles = [userRole];
  return role;
};

export const mockPaginationResult = (): PaginationResult<Role> => {
  const roles = [mockRoleWithPermissions(), mockRoleWithPermissions()];
  roles[1].id = '550e8400-e29b-41d4-a716-446655440031';
  roles[1].name = 'admin';

  return {
    data: roles,
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};
