import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PixWebhookController } from './controllers/pix-webhook.controller';
import { BoletoWebhookController } from './controllers/boleto-webhook.controller';
import { BillPaymentWebhookController } from './controllers/bill-payment-webhook.controller';
import { PixWebhookService } from './services/pix-webhook.service';
import { BoletoWebhookService } from './services/boleto-webhook.service';
import { BillPaymentWebhookService } from './services/bill-payment-webhook.service';
import { BillPaymentWebhookProcessor } from './processors/bill-payment-webhook.processor';
import { BoletoWebhookProcessor } from './processors/boleto-webhook.processor';
import { PixWebhookProcessor } from './processors/pix-webhook.processor';
import { WebhookEventLogService } from './services/webhook-event-log.service';
import { WebhookPublicKeyGuard } from './guards/webhook-public-key.guard';
import { WebhookCleanupScheduler } from './schedulers/webhook-cleanup.scheduler';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixRefund } from '@/pix/entities/pix-refund.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixQrCode } from '@/pix/entities/pix-qr-code.entity';
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { Webhook } from '@/webhook/entities/webhook.entity';
import { WebhookEventLog } from './entities/webhook-event-log.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { BoletoPayer } from '@/boleto/entities/boleto-payer.entity';
import { TransactionModule } from '@/transaction/transaction.module';
import { AccountModule } from '@/account/account.module';
import { TedTransfer } from '@/ted/entities/ted-transfer.entity';
import { TedCashIn } from '@/ted/entities/ted-cash-in.entity';
import { TedRefund } from '@/ted/entities/ted-refund.entity';
import { TedWebhookService } from './services/ted-webhook.service';
import { TedWebhookController } from './controllers/ted-webhook.controller';
import { TedWebhookProcessor } from './processors/ted-webhook.processor';
import { HiperbancoPixWebhookNormalizer } from '@/financial-providers/providers/hiperbanco/webhook/hiperbanco-pix-webhook.normalizer';
import { HiperbancoBoletoWebhookNormalizer } from '@/financial-providers/providers/hiperbanco/webhook/hiperbanco-boleto-webhook.normalizer';
import { HiperbancoBillPaymentWebhookNormalizer } from '@/financial-providers/providers/hiperbanco/webhook/hiperbanco-bill-payment-webhook.normalizer';
import { HiperbancoTedWebhookNormalizer } from '@/financial-providers/providers/hiperbanco/webhook/hiperbanco-ted-webhook.normalizer';
import { getQueueConfig } from '@/queue/policies/queue-policy.accessors';
import { WebhooksModule } from '@/modules/webhooks/webhooks.module';
import {
  PixWebhookNormalizerRegistry,
  PIX_WEBHOOK_NORMALIZERS,
} from './registries/pix-webhook-normalizer.registry';
import {
  BoletoWebhookNormalizerRegistry,
  BOLETO_WEBHOOK_NORMALIZERS,
} from './registries/boleto-webhook-normalizer.registry';
import {
  BillPaymentWebhookNormalizerRegistry,
  BILL_PAYMENT_WEBHOOK_NORMALIZERS,
} from './registries/bill-payment-webhook-normalizer.registry';
import {
  TedWebhookNormalizerRegistry,
  TED_WEBHOOK_NORMALIZERS,
} from './registries/ted-webhook-normalizer.registry';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PixCashIn,
      PixRefund,
      PixTransfer,
      PixQrCode,
      Boleto,
      BillPayment,
      Webhook,
      WebhookEventLog,
      PaymentSender,
      PaymentRecipient,
      BoletoPayer,
      TedTransfer,
      TedCashIn,
      TedRefund,
    ]),
    TransactionModule,
    AccountModule,
    WebhooksModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      getQueueConfig('webhookBillPayment'),
      getQueueConfig('webhookBoleto'),
      getQueueConfig('webhookPix'),
      getQueueConfig('webhookTed'),
    ),
  ],
  controllers: [
    PixWebhookController,
    BoletoWebhookController,
    BillPaymentWebhookController,
    TedWebhookController,
  ],
  providers: [
    PixWebhookService,
    BoletoWebhookService,
    BillPaymentWebhookService,
    WebhookEventLogService,
    WebhookPublicKeyGuard,
    WebhookCleanupScheduler,
    BillPaymentWebhookProcessor,
    BoletoWebhookProcessor,
    PixWebhookProcessor,
    TedWebhookService,
    TedWebhookProcessor,
    HiperbancoPixWebhookNormalizer,
    HiperbancoBoletoWebhookNormalizer,
    HiperbancoBillPaymentWebhookNormalizer,
    HiperbancoTedWebhookNormalizer,
    {
      provide: PIX_WEBHOOK_NORMALIZERS,
      useFactory: (hiperbanco: HiperbancoPixWebhookNormalizer) => [hiperbanco],
      inject: [HiperbancoPixWebhookNormalizer],
    },
    {
      provide: BOLETO_WEBHOOK_NORMALIZERS,
      useFactory: (hiperbanco: HiperbancoBoletoWebhookNormalizer) => [
        hiperbanco,
      ],
      inject: [HiperbancoBoletoWebhookNormalizer],
    },
    {
      provide: BILL_PAYMENT_WEBHOOK_NORMALIZERS,
      useFactory: (hiperbanco: HiperbancoBillPaymentWebhookNormalizer) => [
        hiperbanco,
      ],
      inject: [HiperbancoBillPaymentWebhookNormalizer],
    },
    {
      provide: TED_WEBHOOK_NORMALIZERS,
      useFactory: (hiperbanco: HiperbancoTedWebhookNormalizer) => [hiperbanco],
      inject: [HiperbancoTedWebhookNormalizer],
    },
    PixWebhookNormalizerRegistry,
    BoletoWebhookNormalizerRegistry,
    BillPaymentWebhookNormalizerRegistry,
    TedWebhookNormalizerRegistry,
  ],
  exports: [
    BillPaymentWebhookService,
    WebhookEventLogService,
    TedWebhookService,
  ],
})
export class WebhookProcessorModule {}
