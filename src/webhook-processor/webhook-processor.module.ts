import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixWebhookController } from './controllers/pix-webhook.controller';
import { BoletoWebhookController } from './controllers/boleto-webhook.controller';
import { BillPaymentWebhookController } from './controllers/bill-payment-webhook.controller';
import { PixWebhookService } from './services/pix-webhook.service';
import { BoletoWebhookService } from './services/boleto-webhook.service';
import { BillPaymentWebhookService } from './services/bill-payment-webhook.service';
import { WebhookPublicKeyGuard } from './guards/webhook-public-key.guard';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixRefund } from '@/pix/entities/pix-refund.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { Webhook } from '@/webhook/entities/webhook.entity';
import { TransactionModule } from '@/transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PixCashIn,
      PixRefund,
      PixTransfer,
      Boleto,
      BillPayment,
      Webhook,
    ]),
    TransactionModule,
  ],
  controllers: [
    PixWebhookController,
    BoletoWebhookController,
    BillPaymentWebhookController,
  ],
  providers: [
    PixWebhookService,
    BoletoWebhookService,
    BillPaymentWebhookService,
    WebhookPublicKeyGuard,
  ],
  exports: [PixWebhookService, BoletoWebhookService, BillPaymentWebhookService],
})
export class WebhookProcessorModule {}
