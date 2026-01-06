import { Injectable } from '@nestjs/common';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { RegisterWebhookResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { WebhookProviderHelper } from './helpers/webhook-provider.helper';
import { WebhookRepository } from './repositories/webhook.repository';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';

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
}
