import { Module } from '@nestjs/common';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { PixProviderHelper } from './helpers/pix-provider.helper';
import { HiperbancoPixHelper } from './helpers/hiperbanco/hiperbanco-pix.helper';
import { FinancialProvidersModule } from '@/financial-providers/financial-providers.module';
import { AccountModule } from '@/account/account.module';

@Module({
  imports: [FinancialProvidersModule, AccountModule],
  controllers: [PixController],
  providers: [PixService, PixProviderHelper, HiperbancoPixHelper],
  exports: [PixService],
})
export class PixModule {}
