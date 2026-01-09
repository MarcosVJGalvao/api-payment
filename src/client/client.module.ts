import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { BaseQueryModule } from '../common/base-query/base-query.module';
import { LoggerModule } from '../common/logger/logger.module';
import { ClientGuard } from '../common/guards/client.guard';
import { InternalUserModule } from '../internal-user/internal-user.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    BaseQueryModule,
    LoggerModule,
    InternalUserModule,
    PermissionsModule,
  ],
  controllers: [ClientController],
  providers: [ClientService, ClientGuard],
  exports: [ClientService, ClientGuard],
})
export class ClientModule {}
