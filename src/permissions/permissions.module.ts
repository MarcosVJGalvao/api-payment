import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { ClientRole } from './entities/client-role.entity';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { PermissionController } from './controllers/permission.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { ClientPermissionGuard } from '@/common/guards/client-permission.guard';
import { RedisModule } from '@/common/redis/redis.module';
import { BaseQueryModule } from '@/common/base-query/base-query.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      RolePermission,
      ClientRole,
    ]),
    RedisModule,
    BaseQueryModule,
    ClientModule,
  ],
  controllers: [PermissionController, RoleController],
  providers: [PermissionService, RoleService, PermissionsGuard, ClientPermissionGuard],
  exports: [PermissionService, RoleService, PermissionsGuard, ClientPermissionGuard],
})
export class PermissionsModule { }
