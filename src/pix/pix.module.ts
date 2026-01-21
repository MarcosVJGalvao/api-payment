import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { PixProviderHelper } from './helpers/pix-provider.helper';
import { HiperbancoPixHelper } from './helpers/hiperbanco/hiperbanco-pix.helper';
import { PixSyncHelper } from './helpers/pix-sync.helper';
import { FinancialProvidersModule } from '@/financial-providers/financial-providers.module';
import { AccountModule } from '@/account/account.module';
import { PixTransfer } from './entities/pix-transfer.entity';
import { PixQrCode } from './entities/pix-qr-code.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { ClientModule } from '@/client/client.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { TransactionModule } from '@/transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PixTransfer,
      PixQrCode,
      PaymentSender,
      PaymentRecipient,
    ]),
    FinancialProvidersModule,
    AccountModule,
    ClientModule,
    PermissionsModule,
    TransactionModule,
  ],
  controllers: [PixController],
  providers: [
    PixService,
    PixProviderHelper,
    HiperbancoPixHelper,
    PixSyncHelper,
  ],
  exports: [PixService],
})
export class PixModule {}
