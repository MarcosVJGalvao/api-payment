import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TedController } from './ted.controller';
import { TedService } from './ted.service';
import { TedTransfer } from './entities/ted-transfer.entity';
import { TedCashIn } from './entities/ted-cash-in.entity';
import { TedRefund } from './entities/ted-refund.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { Account } from '@/account/entities/account.entity';
import { TransactionModule } from '@/transaction/transaction.module';
import { FinancialProvidersModule } from '@/financial-providers/financial-providers.module';
import { HiperbancoTedHelper } from './helpers/hiperbanco/hiperbanco-ted.helper';
import { TedProviderHelper } from './helpers/ted-provider.helper';
import { BaseQueryModule } from '@/common/base-query/base-query.module';
import { ClientModule } from '@/client/client.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { AccountModule } from '@/account/account.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TedTransfer,
      TedCashIn,
      TedRefund,
      PaymentSender,
      PaymentRecipient,
      Account,
    ]),
    TransactionModule,
    FinancialProvidersModule,
    BaseQueryModule,
    ClientModule,
    PermissionsModule,
    AccountModule,
  ],
  controllers: [TedController],
  providers: [TedService, HiperbancoTedHelper, TedProviderHelper],
  exports: [TedService],
})
export class TedModule {}

