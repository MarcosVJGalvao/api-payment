import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { ClientRole } from '../entities/client-role.entity';
import { RedisService } from '@/common/redis/redis.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { QueryPermissionDto } from '../dto/query-permission.dto';
import { CreateBulkPermissionsDto } from '../dto/create-bulk-permissions.dto';
import { checkPermissionHierarchy } from '../helpers/permission.helper';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { FilterOperator } from '@/common/base-query/enums/filter-operator.enum';

@Injectable()
export class PermissionService {
  private readonly cacheTtl: number;

  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(ClientRole)
    private clientRoleRepository: Repository<ClientRole>,
    private redisService: RedisService,
    private configService: ConfigService,
    private baseQueryService: BaseQueryService,
  ) {
    this.cacheTtl = this.configService.get<number>('REDIS_TTL', 3600);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    // TODO: Implement generic user permission retrieval or integrate when User module exists
    return [];
  }

  async getUserRoles(userId: string): Promise<string[]> {
    // TODO: Implement generic user role retrieval or integrate when User module exists
    return [];
  }

  async hasPermission(
    userId: string,
    requiredPermission: string,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return checkPermissionHierarchy(userPermissions, requiredPermission);
  }

  async hasAnyPermission(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  async hasAllPermissions(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const permissionsKey = `user_permissions:${userId}`;
    const rolesKey = `user_roles:${userId}`;

    await this.redisService.del(permissionsKey);
    await this.redisService.del(rolesKey);
  }

  async getAllPermissions(
    queryDto: QueryPermissionDto,
  ): Promise<PaginationResult<Permission>> {
    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.permissionRepository,
      queryDto,
      {
        relations: ['rolePermissions', 'rolePermissions.role'],
        defaultSortBy: 'module',
        searchFields: ['name', 'module', 'action', 'description'],
        dateField: 'createdAt',
        select: [
          'id',
          'name',
          'module',
          'action',
          'description',
          'rolePermissions.id',
          'rolePermissions.role.id',
          'rolePermissions.role.name',
          'rolePermissions.role.description',
          'createdAt',
          'updatedAt',
        ],
        filters: [
          {
            field: 'module',
            operator: FilterOperator.EQUALS,
          },
          {
            field: 'action',
            operator: FilterOperator.EQUALS,
          },
        ],
      },
    );

    return this.baseQueryService.findAll(
      this.permissionRepository,
      queryOptions,
    );
  }

  async getPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: { rolePermissions: { role: true } },
    });

    if (!permission) {
      throw new CustomHttpException(
        'Permission not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.PERMISSION_NOT_FOUND,
      );
    }

    return permission;
  }

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    const existingPermission = await this.permissionRepository.findOne({
      where: { 
        name: createPermissionDto.name,
        clientId: createPermissionDto.clientId || null,
      },
    });

    if (existingPermission) {
      throw new CustomHttpException(
        'Permission already exists.',
        HttpStatus.CONFLICT,
        ErrorCode.PERMISSION_ALREADY_EXISTS,
      );
    }

    const permission = this.permissionRepository.create(createPermissionDto);

    return this.permissionRepository.save(permission);
  }

  async createBulkPermissions(
    createBulkPermissionsDto: CreateBulkPermissionsDto,
  ): Promise<Permission[]> {
    const { module, actions, description } = createBulkPermissionsDto;
    const createdPermissions: Permission[] = [];
    const existingPermissions: string[] = [];
    const errors: string[] = [];

    for (const action of actions) {
      const permissionName = `${module}:${action}`;

      const existingPermission = await this.permissionRepository.findOne({
        where: { name: permissionName },
      });

      if (existingPermission) {
        existingPermissions.push(permissionName);
        continue;
      }

      try {
        const permission = this.permissionRepository.create({
          name: permissionName,
          module,
          action,
          description: description || `Permite ${action} no módulo ${module}`,
        });

        const savedPermission =
          await this.permissionRepository.save(permission);
        createdPermissions.push(savedPermission);
      } catch (error: any) {
        errors.push(`${permissionName}: ${error?.message || 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      throw new CustomHttpException(
        `Erro ao criar algumas permissões: ${errors.join(', ')}`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.PERMISSION_NOT_FOUND,
      );
    }

    if (createdPermissions.length === 0 && existingPermissions.length > 0) {
      throw new CustomHttpException(
        `Todas as permissões já existem: ${existingPermissions.join(', ')}`,
        HttpStatus.CONFLICT,
        ErrorCode.PERMISSION_ALREADY_EXISTS,
      );
    }

    return createdPermissions;
  }

  async updatePermission(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new CustomHttpException(
        'Permission not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.PERMISSION_NOT_FOUND,
      );
    }

    if (updatePermissionDto.name) permission.name = updatePermissionDto.name;
    if (updatePermissionDto.module)
      permission.module = updatePermissionDto.module;
    if (updatePermissionDto.action)
      permission.action = updatePermissionDto.action;
    if (updatePermissionDto.description !== undefined)
      permission.description = updatePermissionDto.description;

    return this.permissionRepository.save(permission);
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: {
        rolePermissions: { role: true },
      },
    });

    if (!permission) {
      throw new CustomHttpException(
        'Permission not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.PERMISSION_NOT_FOUND,
      );
    }

    // TODO: Invalidate cache for users who have this permission indirectly via roles
    // Logic removed because it depended on User entities.

    await this.permissionRepository.remove(permission);
  }

  async assignPermissionToUser(
    userId: string,
    permissionId: string,
  ): Promise<void> {
    // TODO: Implement when User module is available
    throw new CustomHttpException(
      'Feature not available without User module',
      HttpStatus.NOT_IMPLEMENTED,
      ErrorCode.FEATURE_NOT_IMPLEMENTED
    );
  }

  async removePermissionFromUser(
    userId: string,
    permissionId: string,
  ): Promise<void> {
    // TODO: Implement when User module is available
    return;
  }

  async getUserDirectPermissions(userId: string): Promise<Permission[]> {
    // TODO: Implement when User module is available
    return [];
  }

  /**
   * Busca todas as roles vinculadas a um client
   * @param clientId - ID do cliente
   * @returns Array de roles com suas permissões
   */
  async getClientRoles(clientId: string): Promise<Role[]> {
    const clientRoles = await this.clientRoleRepository.find({
      where: { clientId },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    });

    return clientRoles.map((cr) => cr.role);
  }

  /**
   * Verifica se um client tem uma role específica
   * @param clientId - ID do cliente
   * @param roleName - Nome da role (ex: 'auth:bank')
   * @returns true se o client tem a role
   */
  async clientHasRole(clientId: string, roleName: string): Promise<boolean> {
    // Buscar role global primeiro (clientId = null)
    let role = await this.roleRepository.findOne({
      where: { name: roleName, clientId: null },
    });

    // Se não encontrar role global, buscar role específica do client
    if (!role) {
      role = await this.roleRepository.findOne({
        where: { name: roleName, clientId },
      });
    }

    if (!role) {
      return false;
    }

    // Verificar se client tem acesso à role (via client_role)
    const clientRole = await this.clientRoleRepository.findOne({
      where: { clientId, roleId: role.id },
    });

    return !!clientRole;
  }

  /**
   * Verifica se um client tem uma permissão específica através de suas roles
   * @param clientId - ID do cliente
   * @param permissionName - Nome da permissão (ex: 'financial:boleto')
   * @returns true se o client tem a permissão
   */
  async clientHasPermission(clientId: string, permissionName: string): Promise<boolean> {
    const clientRoles = await this.getClientRoles(clientId);

    // Coletar todos os nomes de permissões das roles do client
    const allPermissionNames = new Set<string>();

    for (const role of clientRoles) {
      if (role.rolePermissions) {
        for (const rolePermission of role.rolePermissions) {
          if (rolePermission.permission) {
            allPermissionNames.add(rolePermission.permission.name);
          }
        }
      }
    }

    // Verificar também permissões globais e específicas do client diretamente
    const directPermissions = await this.permissionRepository.find({
      where: [
        { name: permissionName, clientId: null }, // Permissões globais
        { name: permissionName, clientId }, // Permissões específicas do client
      ],
    });

    for (const perm of directPermissions) {
      allPermissionNames.add(perm.name);
    }

    if (allPermissionNames.size === 0) {
      return false;
    }

    const permissionNames = Array.from(allPermissionNames);
    return checkPermissionHierarchy(permissionNames, permissionName);
  }

  /**
   * Vincula uma role a um client
   * @param clientId - ID do cliente
   * @param roleId - ID da role
   */
  async assignRoleToClient(clientId: string, roleId: string): Promise<void> {
    const existingClientRole = await this.clientRoleRepository.findOne({
      where: { clientId, roleId },
    });

    if (existingClientRole) {
      return; // Já está vinculado
    }

    const clientRole = this.clientRoleRepository.create({
      clientId,
      roleId,
    });

    await this.clientRoleRepository.save(clientRole);
  }

  /**
   * Remove vínculo de role de um client
   * @param clientId - ID do cliente
   * @param roleId - ID da role
   */
  async removeRoleFromClient(clientId: string, roleId: string): Promise<void> {
    const clientRole = await this.clientRoleRepository.findOne({
      where: { clientId, roleId },
    });

    if (clientRole) {
      await this.clientRoleRepository.remove(clientRole);
    }
  }
}
