import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountService } from './account.service';
import { AccountGuard } from '../common/guards/account.guard';
import { FinancialProvidersModule } from '../financial-providers/financial-providers.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    FinancialProvidersModule,
    ClientModule,
  ],
  providers: [AccountService, AccountGuard],
  exports: [AccountService, AccountGuard],
})
export class AccountModule {}
