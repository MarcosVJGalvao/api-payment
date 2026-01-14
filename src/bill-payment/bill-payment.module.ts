import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillPayment } from './entities/bill-payment.entity';
import { BillPaymentService } from './bill-payment.service';
import { BillPaymentController } from './bill-payment.controller';
import { FinancialProvidersModule } from '../financial-providers/financial-providers.module';
import { BaseQueryModule } from '../common/base-query/base-query.module';
import { AuditModule } from '../common/audit/audit.module';
import { LoggerModule } from '../common/logger/logger.module';
import { BillPaymentProviderHelper } from './helpers/bill-payment-provider.helper';
import { BillPaymentSyncHelper } from './helpers/bill-payment-sync.helper';
import { HiperbancoBillPaymentHelper } from './helpers/hiperbanco/hiperbanco-bill-payment.helper';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import { ClientModule } from '../client/client.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AccountModule } from '../account/account.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillPayment]),
    FinancialProvidersModule,
    BaseQueryModule,
    AuditModule,
    LoggerModule,
    ClientModule,
    PermissionsModule,
    AccountModule,
    TransactionModule,
  ],
  controllers: [BillPaymentController],
  providers: [
    BillPaymentService,
    BillPaymentProviderHelper,
    BillPaymentSyncHelper,
    HiperbancoBillPaymentHelper,
    FinancialProviderPipe,
  ],
  exports: [BillPaymentService],
})
export class BillPaymentModule {}
