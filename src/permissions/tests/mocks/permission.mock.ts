import { CreatePermissionDto } from '../../dto/create-permission.dto';
import { UpdatePermissionDto } from '../../dto/update-permission.dto';
import { QueryPermissionDto } from '../../dto/query-permission.dto';
import { Permission } from '../../entities/permission.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { UserPermission } from '@/user/entities/user-permission.entity';
import { UserRole } from '@/user/entities/user-role.entity';
import { Role } from '../../entities/role.entity';
import { User } from '@/user/entities/user.entity';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { mockUserWithEmployee } from '@/user/tests/mocks/user.mock';

export const mockCreatePermissionDto = (): CreatePermissionDto => ({
  name: 'user:read',
  module: 'user',
  action: 'read',
  description: 'Permite ler usuários',
});

export const mockUpdatePermissionDto = (): UpdatePermissionDto => ({
  name: 'user:write',
  module: 'user',
  action: 'write',
  description: 'Permite criar e editar usuários',
});

export const mockQueryPermissionDto = (): QueryPermissionDto => ({
  page: 1,
  limit: 10,
  module: 'user',
  action: 'read',
});

export const mockPermission = (): Permission => {
  const permission = new Permission();
  permission.id = '550e8400-e29b-41d4-a716-446655440020';
  permission.name = 'user:read';
  permission.module = 'user';
  permission.action = 'read';
  permission.description = 'Permite ler usuários';
  permission.createdAt = new Date('2024-01-01T00:00:00.000Z');
  permission.updatedAt = new Date('2024-01-01T00:00:00.000Z');
  (permission as any).deletedAt = null;
  return permission;
};

export const mockRolePermission = (): RolePermission => {
  const rolePermission = new RolePermission();
  rolePermission.id = '550e8400-e29b-41d4-a716-446655440040';
  rolePermission.permission = mockPermission();
  rolePermission.createdAt = new Date('2024-01-01T00:00:00.000Z');
  rolePermission.updatedAt = new Date('2024-01-01T00:00:00.000Z');
  (rolePermission as any).deletedAt = null;
  return rolePermission;
};

export const mockUserPermission = (): UserPermission => {
  const userPermission = new UserPermission();
  userPermission.id = '550e8400-e29b-41d4-a716-446655440060';
  userPermission.user = mockUserWithEmployee();
  userPermission.permission = mockPermission();
  userPermission.createdAt = new Date('2024-01-01T00:00:00.000Z');
  userPermission.updatedAt = new Date('2024-01-01T00:00:00.000Z');
  (userPermission as any).deletedAt = null;
  return userPermission;
};

export const mockPermissionWithRoles = (): Permission => {
  const permission = mockPermission();
  const rolePermission = mockRolePermission();
  rolePermission.permission = permission;
  permission.rolePermissions = [rolePermission];
  return permission;
};

export const mockRole = (): Role => {
  const role = new Role();
  role.id = '550e8400-e29b-41d4-a716-446655440030';
  role.name = 'admin';
  role.description = 'Administrador';
  role.createdAt = new Date('2024-01-01T00:00:00.000Z');
  role.updatedAt = new Date('2024-01-01T00:00:00.000Z');
  (role as any).deletedAt = null;
  return role;
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

export const mockUserWithRoles = (): User => {
  const user = mockUserWithEmployee();
  const userRole = mockUserRole();
  userRole.user = user;
  user.userRoles = [userRole];
  return user;
};

export const mockPaginationResult = (): PaginationResult<Permission> => {
  const permissions = [mockPermission(), mockPermission()];
  permissions[1].id = '550e8400-e29b-41d4-a716-446655440021';
  permissions[1].name = 'user:write';
  permissions[1].action = 'write';

  return {
    data: permissions,
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
