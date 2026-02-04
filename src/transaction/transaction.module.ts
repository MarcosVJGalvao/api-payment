import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionRepository } from './repositories/transaction.repository';
import { TransactionService } from './transaction.service';
import { BaseQueryModule } from '@/common/base-query/base-query.module';
import { TransactionController } from './transaction.controller';
import { FinancialProvidersModule } from '@/financial-providers/financial-providers.module';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixRefund } from '@/pix/entities/pix-refund.entity';
import { PixQrCode } from '@/pix/entities/pix-qr-code.entity';
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { TedTransfer } from '@/ted/entities/ted-transfer.entity';
import { TedCashIn } from '@/ted/entities/ted-cash-in.entity';
import { TedRefund } from '@/ted/entities/ted-refund.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      PixCashIn,
      PixTransfer,
      PixRefund,
      PixQrCode,
      Boleto,
      BillPayment,
      TedTransfer,
      TedCashIn,
      TedRefund,
    ]),
    BaseQueryModule,
    FinancialProvidersModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionRepository, TransactionService],
  exports: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
