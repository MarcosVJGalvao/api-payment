import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WebhookConfiguration } from './entities/webhook-configuration.entity';
import { WebhookMessage } from './entities/webhook-message.entity';
import { WebhookConfigurationRepository } from './repositories/webhook-configuration.repository';
import { WebhookMessageRepository } from './repositories/webhook-message.repository';
import { WebhookHmacSigningService } from './services/webhook-hmac-signing.service';
import { WebhookConfigurationService } from './services/webhook-configuration.service';
import { WebhookMessageService } from './services/webhook-message.service';
import { OutboundWebhookDispatchService } from './services/outbound-webhook-dispatch.service';
import { ProviderWebhookBootstrapService } from './services/provider-webhook-bootstrap.service';
import { OutboundWebhookDeliveryProcessor } from './processors/outbound-webhook-delivery.processor';
import { OutboundWebhookDispatchTrigger } from './triggers/outbound-webhook-dispatch.trigger';
import { WebhookConfigurationController } from './controllers/webhook-configuration.controller';
import { WebhookMessageController } from './controllers/webhook-message.controller';
import { WebhookModule } from '@/webhook/webhook.module';
import { BackofficeUserModule } from '@/backoffice-user/backoffice-user.module';
import { getQueueConfig } from '@/queue/policies/queue-policy.accessors';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookConfiguration, WebhookMessage]),
    BullModule.registerQueue(getQueueConfig('webhookOutboundDelivery')),
    HttpModule,
    ConfigModule,
    WebhookModule,
    BackofficeUserModule,
  ],
  controllers: [WebhookConfigurationController, WebhookMessageController],
  providers: [
    WebhookConfigurationRepository,
    WebhookMessageRepository,
    WebhookHmacSigningService,
    WebhookConfigurationService,
    WebhookMessageService,
    OutboundWebhookDispatchService,
    ProviderWebhookBootstrapService,
    OutboundWebhookDeliveryProcessor,
    OutboundWebhookDispatchTrigger,
  ],
  exports: [
    OutboundWebhookDispatchTrigger,
    OutboundWebhookDispatchService,
    WebhookConfigurationService,
    WebhookMessageService,
  ],
})
export class WebhooksModule {}
