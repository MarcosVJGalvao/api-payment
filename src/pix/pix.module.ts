import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { PixProviderHelper } from './helpers/pix-provider.helper';
import { HiperbancoPixHelper } from './helpers/hiperbanco/hiperbanco-pix.helper';
import { FinancialProvidersModule } from '@/financial-providers/financial-providers.module';
import { AccountModule } from '@/account/account.module';
import { PixTransfer } from './entities/pix-transfer.entity';
import { ClientModule } from '@/client/client.module';
import { PermissionsModule } from '@/permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PixTransfer]),
    FinancialProvidersModule,
    AccountModule,
    ClientModule,
    PermissionsModule,
  ],
  controllers: [PixController],
  providers: [PixService, PixProviderHelper, HiperbancoPixHelper],
  exports: [PixService],
})
export class PixModule {}
