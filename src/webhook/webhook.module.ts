import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from './entities/webhook.entity';
import { WebhookService } from './webhook.service';
import { FinancialProvidersModule } from '../financial-providers/financial-providers.module';
import { HiperbancoWebhookHelper } from './helpers/hiperbanco/hiperbanco-webhook.helper';
import { WebhookController } from './webhook.controller';
import { WebhookProviderHelper } from './helpers/webhook-provider.helper';
import { WebhookRepository } from './repositories/webhook.repository';
import { LoggerModule } from '../common/logger/logger.module';
import { ClientModule } from '../client/client.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Webhook]),
        FinancialProvidersModule,
        LoggerModule,
        ClientModule,
    ],
    controllers: [WebhookController],
    providers: [
        WebhookService,
        WebhookRepository,
        WebhookProviderHelper,
        HiperbancoWebhookHelper,
    ],
    exports: [WebhookService],
})
export class WebhookModule { }
