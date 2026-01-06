import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UpdateRolePermissionsDto } from '../dto/update-role-permissions.dto';
import { QueryRoleDto } from '../dto/query-role.dto';
import { AssignRoleBodyDto } from '../dto/assign-role-body.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionName } from '../enums/permission-name.enum';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { ApiCreateRole } from '../docs/api-create-role.decorator';
import { ApiGetAllRole } from '../docs/api-get-all-role.decorator';
import { ApiGetRoleById } from '../docs/api-get-role-by-id.decorator';
import { ApiUpdateRole } from '../docs/api-update-role.decorator';
import { ApiRemoveRole } from '../docs/api-remove-role.decorator';
import { ApiAssignRole } from '../docs/api-assign-role.decorator';
import { ApiRemoveRoleFromUser } from '../docs/api-remove-role-from-user.decorator';
import { ApiUpdateRolePermissions } from '../docs/api-update-role-permissions.decorator';

@Controller('roles')
@ApiTags('Roles')
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateRole()
  @Audit({
    action: AuditAction.ROLE_ASSIGNED,
    entityType: 'Role',
    description: 'Created a role',
    captureNewValues: true,
  })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.roleService.createRole(createRoleDto);
  }

  @Get()
  @RequirePermissions(PermissionName.ALL)
  @ApiGetAllRole()
  async findAll(@Query() queryDto: QueryRoleDto) {
    return await this.roleService.getAllRoles(queryDto);
  }

  @Get(':id')
  @RequirePermissions(PermissionName.ALL)
  @ApiGetRoleById()
  async findOne(@Param('id') id: string) {
    return await this.roleService.getRoleById(id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionName.ALL)
  @ApiUpdateRole()
  @Audit({
    action: AuditAction.ROLE_ASSIGNED,
    entityType: 'Role',
    entityIdParam: 'id',
    description: 'Updated a role',
    captureOldValues: true,
    captureNewValues: true,
  })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.roleService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveRole()
  @Audit({
    action: AuditAction.ROLE_REMOVED,
    entityType: 'Role',
    entityIdParam: 'id',
    description: 'Deleted a role',
    captureNewValues: false,
  })
  async remove(@Param('id') id: string) {
    return await this.roleService.deleteRole(id);
  }

  @Post(':id/assign')
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAssignRole()
  @Audit({
    action: AuditAction.ROLE_ASSIGNED,
    entityType: 'Role',
    entityIdParam: 'id',
    description: 'Assigned role to user',
    captureNewValues: true,
  })
  async assignRole(
    @Param('id') roleId: string,
    @Body() assignRoleBodyDto: AssignRoleBodyDto,
  ) {
    return await this.roleService.assignRoleToUser(
      assignRoleBodyDto.userId,
      roleId,
    );
  }

  @Delete(':id/assign/:userId')
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveRoleFromUser()
  @Audit({
    action: AuditAction.ROLE_REMOVED,
    entityType: 'Role',
    entityIdParam: 'id',
    description: 'Removed role from user',
    captureNewValues: false,
  })
  async removeRole(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
  ) {
    return await this.roleService.removeRoleFromUser(userId, roleId);
  }

  @Patch(':id/permissions')
  @RequirePermissions(PermissionName.ALL)
  @ApiUpdateRolePermissions()
  @Audit({
    action: AuditAction.ROLE_ASSIGNED,
    entityType: 'Role',
    entityIdParam: 'id',
    description: 'Updated role permissions',
    captureOldValues: true,
    captureNewValues: true,
  })
  async updatePermissions(
    @Param('id') id: string,
    @Body() updateRolePermissionsDto: UpdateRolePermissionsDto,
  ) {
    return await this.roleService.updateRolePermissions(
      id,
      updateRolePermissionsDto,
    );
  }
}
