import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { Webhook } from './entities/webhook.entity';
import { WebhookService } from './webhook.service';
import { FinancialProvidersModule } from '../financial-providers/financial-providers.module';
import { HiperbancoWebhookHelper } from './helpers/hiperbanco/hiperbanco-webhook.helper';
import { WebhookController } from './webhook.controller';
import { WebhookInternalController } from './webhook-internal.controller';
import { WebhookProviderHelper } from './helpers/webhook-provider.helper';
import { ProviderSessionHelper } from './helpers/provider-session.helper';
import { WebhookRepository } from './repositories/webhook.repository';
import { WebhookProcessor } from './webhook.processor';
import { LoggerModule } from '../common/logger/logger.module';
import { ClientModule } from '../client/client.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { BackofficeUserModule } from '../backoffice-user/backoffice-user.module';
import { InternalUserModule } from '../internal-user/internal-user.module';
import { BaseQueryModule } from '../common/base-query/base-query.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook]),
    FinancialProvidersModule,
    LoggerModule,
    ClientModule,
    PermissionsModule,
    BullModule.registerQueue({
      name: 'webhook',
    }),
    BullBoardModule.forFeature({
      name: 'webhook',
      adapter: BullAdapter,
    }),
    BackofficeUserModule,
    InternalUserModule,
    BaseQueryModule,
  ],
  controllers: [WebhookController, WebhookInternalController],
  providers: [
    WebhookService,
    WebhookRepository,
    WebhookProviderHelper,
    ProviderSessionHelper,
    HiperbancoWebhookHelper,
    WebhookProcessor,
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
