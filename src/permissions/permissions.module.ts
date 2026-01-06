import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { PermissionController } from './controllers/permission.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { RedisModule } from '@/common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      RolePermission,
    ]),
    RedisModule,
  ],
  controllers: [PermissionController, RoleController],
  providers: [PermissionService, RoleService, PermissionsGuard],
  exports: [PermissionService, RoleService, PermissionsGuard],
})
export class PermissionsModule { }
