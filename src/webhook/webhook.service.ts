import { Injectable, HttpStatus } from '@nestjs/common';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import { RegisterWebhookResponse, ListWebhooksResponse, UpdateWebhookResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { WebhookProviderHelper } from './helpers/webhook-provider.helper';
import { WebhookRepository } from './repositories/webhook.repository';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

@Injectable()
export class WebhookService {
    constructor(
        private readonly providerHelper: WebhookProviderHelper,
        private readonly webhookRepository: WebhookRepository,
    ) { }

    async registerWebhook(
        provider: FinancialProvider,
        dto: RegisterWebhookDto,
        session: ProviderSession,
    ): Promise<RegisterWebhookResponse> {
        const response = await this.providerHelper.register(provider, dto, session);
        await this.webhookRepository.saveWebhook(provider, dto, response);
        return response;
    }

    async listWebhooks(
        provider: FinancialProvider,
        query: ListWebhooksQueryDto,
        session: ProviderSession,
    ): Promise<ListWebhooksResponse> {
        return this.providerHelper.list(provider, query, session);
    }

    async updateWebhook(
        provider: FinancialProvider,
        webhookId: string,
        dto: UpdateWebhookDto,
        session: ProviderSession,
    ): Promise<UpdateWebhookResponse> {
        const response = await this.providerHelper.update(provider, webhookId, dto, session);
        await this.webhookRepository.updateWebhookUri(webhookId, dto.uri);
        return response;
    }

    async deleteWebhook(
        provider: FinancialProvider,
        webhookId: string,
        session: ProviderSession,
    ): Promise<void> {
        const webhook = await this.webhookRepository.findByExternalId(webhookId);
        if (!webhook) {
            throw new CustomHttpException(
                'Webhook não encontrado localmente',
                HttpStatus.NOT_FOUND,
                ErrorCode.WEBHOOK_CONFIG_NOT_FOUND,
            );
        }

        await this.providerHelper.delete(provider, webhookId, session);
        await this.webhookRepository.softDelete(webhook.id);
    }
}
