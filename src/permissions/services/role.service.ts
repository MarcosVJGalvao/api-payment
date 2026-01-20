import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { PermissionService } from './permission.service';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { HttpStatus } from '@nestjs/common';
import { RedisService } from '@/common/redis/redis.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UpdateRolePermissionsDto } from '../dto/update-role-permissions.dto';
import { QueryRoleDto } from '../dto/query-role.dto';
// import { revokeAllUserTokens } from '@/auth/helpers/token.helper';
import { findPermissions } from '../helpers/permission-finder.helper';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { FilterOperator } from '@/common/base-query/enums/filter-operator.enum';
import { getCurrentDate } from '@/common/helpers/date.helpers';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    private permissionService: PermissionService,
    private redisService: RedisService,
    private baseQueryService: BaseQueryService,
  ) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new CustomHttpException(
        'Role already exists.',
        HttpStatus.CONFLICT,
        ErrorCode.ROLE_ALREADY_EXISTS,
      );
    }

    const permissions = await findPermissions(
      this.permissionRepository,
      createRoleDto.permissionNames,
      createRoleDto.permissionIds,
    );

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
    });

    const savedRole = await this.roleRepository.save(role);

    if (permissions && permissions.length > 0) {
      const rolePermissions = permissions.map((permission) =>
        this.rolePermissionRepository.create({
          role: savedRole,
          permission,
        }),
      );
      await this.rolePermissionRepository.save(rolePermissions);
    }

    return this.getRoleById(savedRole.id);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    // TODO: Implement when User module is available
    throw new CustomHttpException(
      'Feature not available without User module',
      HttpStatus.NOT_IMPLEMENTED,
      ErrorCode.FEATURE_NOT_IMPLEMENTED,
    );
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    // TODO: Implement when User module is available
    return;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    // TODO: Implement when User module is available
    return [];
  }

  async updateRolePermissions(
    roleId: string,
    updateRolePermissionsDto: UpdateRolePermissionsDto,
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: {
        rolePermissions: { permission: true },
        // userRoles: { user: true },
      },
    });

    if (!role) {
      throw new CustomHttpException(
        'Role not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.ROLE_NOT_FOUND,
      );
    }

    const permissions = await findPermissions(
      this.permissionRepository,
      updateRolePermissionsDto.permissionNames,
      updateRolePermissionsDto.permissionIds,
    );

    const activeRolePermissions =
      role.rolePermissions?.filter((rp) => !rp.deletedAt) || [];
    const permissionIds = new Set(permissions.map((p) => p.id));

    const toDelete = activeRolePermissions.filter(
      (rp) => !permissionIds.has(rp.permission.id),
    );
    if (toDelete.length > 0) {
      const now = getCurrentDate();
      for (const rolePermission of toDelete) {
        rolePermission.deletedAt = now;
      }
      await this.rolePermissionRepository.save(toDelete);
    }

    const existingPermissionIds = new Set(
      activeRolePermissions.map((rp) => rp.permission.id),
    );
    const toCreate = permissions.filter(
      (p) => !existingPermissionIds.has(p.id),
    );
    if (toCreate.length > 0) {
      const newRolePermissions = toCreate.map((permission) =>
        this.rolePermissionRepository.create({
          role,
          permission,
        }),
      );
      await this.rolePermissionRepository.save(newRolePermissions);
    }

    // if (role.userRoles && role.userRoles.length > 0) {
    //   const userIds = new Set<string>();
    //   for (const userRole of role.userRoles) {
    //     if (!userRole.deletedAt && userRole.user) {
    //       userIds.add(userRole.user.id);
    //     }
    //   }
    //   for (const userId of userIds) {
    //     await this.permissionService.invalidateUserCache(userId);
    //     // await revokeAllUserTokens(this.redisService, userId);
    //   }
    // }

    return this.getRoleById(roleId);
  }

  async updateRole(
    roleId: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new CustomHttpException(
        'Role not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.ROLE_NOT_FOUND,
      );
    }

    if (updateRoleDto.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });
      if (existingRole && existingRole.id !== roleId) {
        throw new CustomHttpException(
          'Role name already exists.',
          HttpStatus.CONFLICT,
          ErrorCode.ROLE_ALREADY_EXISTS,
        );
      }
      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    await this.roleRepository.save(role);

    if (updateRoleDto.permissionNames || updateRoleDto.permissionIds) {
      return this.updateRolePermissions(roleId, {
        permissionNames: updateRoleDto.permissionNames,
        permissionIds: updateRoleDto.permissionIds,
      });
    }

    return this.getRoleById(roleId);
  }

  async deleteRole(roleId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      // relations: { userRoles: { user: true } },
    });

    if (!role) {
      throw new CustomHttpException(
        'Role not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.ROLE_NOT_FOUND,
      );
    }

    // if (role.userRoles && role.userRoles.length > 0) {
    //   const userIds = new Set<string>();
    //   for (const userRole of role.userRoles) {
    //     if (!userRole.deletedAt && userRole.user) {
    //       userIds.add(userRole.user.id);
    //     }
    //   }
    //   for (const userId of userIds) {
    //     await this.permissionService.invalidateUserCache(userId);
    //     // await revokeAllUserTokens(this.redisService, userId);
    //   }
    // }

    await this.roleRepository.remove(role);
  }

  async getAllRoles(queryDto: QueryRoleDto): Promise<PaginationResult<Role>> {
    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.roleRepository,
      queryDto,
      {
        relations: ['rolePermissions', 'rolePermissions.permission'],
        defaultSortBy: 'name',
        searchFields: ['name', 'description'],
        dateField: 'createdAt',
        select: [
          'id',
          'name',
          'description',
          'rolePermissions.id',
          'rolePermissions.permission.id',
          'rolePermissions.permission.name',
          'rolePermissions.permission.module',
          'rolePermissions.permission.action',
          'rolePermissions.permission.description',
          'createdAt',
          'updatedAt',
        ],
        filters: [
          {
            field: 'name',
            operator: FilterOperator.EQUALS,
          },
        ],
      },
    );

    return this.baseQueryService.findAll(this.roleRepository, queryOptions);
  }

  async getRoleById(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: { rolePermissions: { permission: true } },
    });

    if (!role) {
      throw new CustomHttpException(
        'Role not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.ROLE_NOT_FOUND,
      );
    }

    return role;
  }
}
