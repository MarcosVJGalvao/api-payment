import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from './entities/webhook.entity';
import { WebhookService } from './webhook.service';
import { FinancialProvidersModule } from '../financial-providers/financial-providers.module';
import { HiperbancoWebhookHelper } from './helpers/hiperbanco/hiperbanco-webhook.helper';
import { WebhookController } from './webhook.controller';
import { WebhookProviderHelper } from './helpers/webhook-provider.helper';
import { WebhookRepository } from './repositories/webhook.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([Webhook]),
        FinancialProvidersModule,
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
