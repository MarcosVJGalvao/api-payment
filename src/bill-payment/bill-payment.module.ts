import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillPayment } from './entities/bill-payment.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
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
import {
  BillPaymentProviderRegistry,
  BILL_PAYMENT_PROVIDERS,
} from '@/financial-providers/registry/bill-payment-provider.registry';
import { HiperbancoBillPaymentProvider } from '@/financial-providers/providers/hiperbanco/hiperbanco-bill-payment.provider';
import { ClientModule } from '../client/client.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AccountModule } from '../account/account.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillPayment, PaymentRecipient]),
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
    HiperbancoBillPaymentProvider,
    {
      provide: BILL_PAYMENT_PROVIDERS,
      useFactory: (hiperbanco: HiperbancoBillPaymentProvider) => [hiperbanco],
      inject: [HiperbancoBillPaymentProvider],
    },
    BillPaymentProviderRegistry,
    FinancialProviderPipe,
  ],
  exports: [BillPaymentService],
})
export class BillPaymentModule {}
