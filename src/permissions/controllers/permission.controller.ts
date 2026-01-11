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
import { PermissionService } from '../services/permission.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { QueryPermissionDto } from '../dto/query-permission.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionName } from '../enums/permission-name.enum';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { ApiCreatePermission } from '../docs/api-create-permission.decorator';
import { ApiGetAllPermission } from '../docs/api-get-all-permission.decorator';
import { ApiGetPermissionById } from '../docs/api-get-permission-by-id.decorator';
import { ApiUpdatePermission } from '../docs/api-update-permission.decorator';
import { ApiRemovePermission } from '../docs/api-remove-permission.decorator';
import { ApiCreateBulkPermissions } from '../docs/api-create-bulk-permissions.decorator';
import { CreateBulkPermissionsDto } from '../dto/create-bulk-permissions.dto';
import { Permission } from '../entities/permission.entity';
import { ApiAssignPermissionToUser } from '../docs/api-assign-permission-to-user.decorator';
import { ApiRemovePermissionFromUser } from '../docs/api-remove-permission-from-user.decorator';
import { ApiGetUserDirectPermissions } from '../docs/api-get-user-direct-permissions.decorator';

@Controller('permissions')
@ApiTags('Permissões')
@UseGuards(PermissionsGuard)
@ApiBearerAuth('internal-auth')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatePermission()
  @Audit({
    action: AuditAction.PERMISSION_GRANTED,
    entityType: 'Permission',
    description: 'Created a permission',
    captureNewValues: true,
  })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.permissionService.createPermission(createPermissionDto);
  }

  @Post('bulk')
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateBulkPermissions()
  async createBulk(@Body() createBulkPermissionsDto: CreateBulkPermissionsDto) {
    return await this.permissionService.createBulkPermissions(
      createBulkPermissionsDto,
    );
  }

  @Get()
  @RequirePermissions(PermissionName.ALL)
  @ApiGetAllPermission()
  async findAll(@Query() queryDto: QueryPermissionDto) {
    return await this.permissionService.getAllPermissions(queryDto);
  }

  @Get(':id')
  @RequirePermissions(PermissionName.ALL)
  @ApiGetPermissionById()
  async findOne(@Param('id') id: string) {
    return await this.permissionService.getPermissionById(id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionName.ALL)
  @ApiUpdatePermission()
  @Audit({
    action: AuditAction.PERMISSION_GRANTED,
    entityType: 'Permission',
    entityIdParam: 'id',
    description: 'Updated a permission',
    captureOldValues: true,
    captureNewValues: true,
  })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.permissionService.updatePermission(
      id,
      updatePermissionDto,
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemovePermission()
  @Audit({
    action: AuditAction.PERMISSION_REVOKED,
    entityType: 'Permission',
    entityIdParam: 'id',
    description: 'Deleted a permission',
    captureNewValues: false,
  })
  async remove(@Param('id') id: string) {
    await this.permissionService.deletePermission(id);
  }

  @Post('users/:userId/permissions/:permissionId')
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAssignPermissionToUser()
  @Audit({
    action: AuditAction.PERMISSION_GRANTED,
    entityType: 'Permission',
    entityIdParam: 'permissionId',
    description: 'Granted permission to user',
    captureNewValues: false,
  })
  async assignPermissionToUser(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<void> {
    await this.permissionService.assignPermissionToUser(userId, permissionId);
  }

  @Delete('users/:userId/permissions/:permissionId')
  @RequirePermissions(PermissionName.ALL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemovePermissionFromUser()
  @Audit({
    action: AuditAction.PERMISSION_REVOKED,
    entityType: 'Permission',
    entityIdParam: 'permissionId',
    description: 'Revoked permission from user',
    captureNewValues: false,
  })
  async removePermissionFromUser(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<void> {
    await this.permissionService.removePermissionFromUser(userId, permissionId);
  }

  @Get('users/:userId/permissions')
  @RequirePermissions(PermissionName.ALL)
  @ApiGetUserDirectPermissions()
  async getUserDirectPermissions(
    @Param('userId') userId: string,
  ): Promise<Permission[]> {
    return await this.permissionService.getUserDirectPermissions(userId);
  }
}
