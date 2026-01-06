import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from '../../webhook.service';
import { WebhookProviderHelper } from '../../helpers/webhook-provider.helper';
import { WebhookRepository } from '../../repositories/webhook.repository';

export async function createWebhookServiceTestFactory() {
    const webhookRepositoryMock = {
        saveWebhook: jest.fn().mockImplementation((provider, dto, response) =>
            Promise.resolve({ id: 'uuid', ...dto, providerSlug: provider, externalId: response.id }),
        ),
        findById: jest.fn(),
        findByProvider: jest.fn(),
        softDelete: jest.fn(),
    };

    const providerHelperMock = {
        register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            WebhookService,
            { provide: WebhookRepository, useValue: webhookRepositoryMock },
            { provide: WebhookProviderHelper, useValue: providerHelperMock },
        ],
    }).compile();

    return {
        webhookService: module.get<WebhookService>(WebhookService),
        webhookRepositoryMock,
        providerHelperMock,
    };
}
