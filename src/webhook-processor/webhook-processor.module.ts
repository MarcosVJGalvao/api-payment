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
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { Webhook } from '@/webhook/entities/webhook.entity';
import { WebhookEventLog } from './entities/webhook-event-log.entity';
import { TransactionModule } from '@/transaction/transaction.module';
import { AccountModule } from '@/account/account.module';

/**
 * Configuração padrão de retry para filas de webhook.
 * - 5 tentativas máximas
 * - Backoff exponencial começando em 5 segundos
 */
const WEBHOOK_QUEUE_DEFAULT_OPTIONS = {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 segundos inicial
    },
    removeOnComplete: true,
    removeOnFail: false, // Manter jobs falhos para análise
  },
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PixCashIn,
      PixRefund,
      PixTransfer,
      Boleto,
      BillPayment,
      Webhook,
      WebhookEventLog,
    ]),
    TransactionModule,
    AccountModule,
    ScheduleModule.forRoot(),
    // Filas de Webhook com Retry Strategy
    BullModule.registerQueue(
      { name: 'webhook-bill-payment', ...WEBHOOK_QUEUE_DEFAULT_OPTIONS },
      { name: 'webhook-boleto', ...WEBHOOK_QUEUE_DEFAULT_OPTIONS },
      { name: 'webhook-pix', ...WEBHOOK_QUEUE_DEFAULT_OPTIONS },
    ),
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
    WebhookEventLogService,
    WebhookPublicKeyGuard,
    WebhookCleanupScheduler,
    BillPaymentWebhookProcessor,
    BoletoWebhookProcessor,
    PixWebhookProcessor,
  ],
  exports: [
    PixWebhookService,
    BoletoWebhookService,
    BillPaymentWebhookService,
    WebhookEventLogService,
  ],
})
export class WebhookProcessorModule {}
