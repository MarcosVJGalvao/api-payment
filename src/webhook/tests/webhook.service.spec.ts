import { WebhookService } from '../webhook.service';
import { createWebhookServiceTestFactory } from './factory/webhook.service.factory';
import {
    mockRegisterWebhookDto,
    mockRegisterWebhookResponse,
    mockProviderSession,
} from './mocks/webhook.mock';
import { validate } from 'class-validator';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { WebhookContext } from '../enums/webhook-context.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

describe('WebhookService', () => {
    let service: WebhookService;
    let webhookRepositoryMock: any;
    let providerHelperMock: any;

    beforeEach(async () => {
        const factory = await createWebhookServiceTestFactory();
        service = factory.webhookService;
        webhookRepositoryMock = factory.webhookRepositoryMock;
        providerHelperMock = factory.providerHelperMock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerWebhook', () => {
        it('should register webhook via provider helper and save to repository', async () => {
            const dto = mockRegisterWebhookDto();
            const expectedResponse = mockRegisterWebhookResponse();
            const session = mockProviderSession();

            providerHelperMock.register.mockResolvedValue(expectedResponse);

            const result = await service.registerWebhook(FinancialProvider.HIPERBANCO, dto, session);

            expect(providerHelperMock.register).toHaveBeenCalledWith(FinancialProvider.HIPERBANCO, dto, session);
            expect(webhookRepositoryMock.saveWebhook).toHaveBeenCalledWith(
                FinancialProvider.HIPERBANCO,
                dto,
                expectedResponse,
            );
            expect(result).toEqual(expectedResponse);
        });

        it('should propagate error from provider helper', async () => {
            const dto = mockRegisterWebhookDto();
            const session = mockProviderSession();

            providerHelperMock.register.mockRejectedValue(new Error('Provider error'));

            await expect(service.registerWebhook(FinancialProvider.HIPERBANCO, dto, session)).rejects.toThrow('Provider error');

            expect(webhookRepositoryMock.saveWebhook).not.toHaveBeenCalled();
        });
    });

    describe('updateWebhook', () => {
        it('should update webhook via provider helper and update repository', async () => {
            const webhookId = 'webhook-id';
            const dto = { uri: 'https://new-uri.com' };
            const session = mockProviderSession();
            const expectedResponse = { ...mockRegisterWebhookResponse(), uri: dto.uri };

            providerHelperMock.update.mockResolvedValue(expectedResponse);

            const result = await service.updateWebhook(FinancialProvider.HIPERBANCO, webhookId, dto, session);

            expect(providerHelperMock.update).toHaveBeenCalledWith(FinancialProvider.HIPERBANCO, webhookId, dto, session);
            expect(webhookRepositoryMock.updateWebhookUri).toHaveBeenCalledWith(webhookId, dto.uri);
            expect(result).toEqual(expectedResponse);
        });

        it('should propagate error from provider helper and not update repository', async () => {
            const webhookId = 'webhook-id';
            const dto = { uri: 'https://new-uri.com' };
            const session = mockProviderSession();

            providerHelperMock.update.mockRejectedValue(new Error('Provider error'));

            await expect(service.updateWebhook(FinancialProvider.HIPERBANCO, webhookId, dto, session))
                .rejects.toThrow('Provider error');

            expect(webhookRepositoryMock.updateWebhookUri).not.toHaveBeenCalled();
        });
    });

    describe('deleteWebhook', () => {
        it('should delete webhook via provider helper and soft delete from repository', async () => {
            const webhookId = 'webhook-id';
            const session = mockProviderSession();
            const webhook = { id: 'internal-id', externalId: webhookId };

            webhookRepositoryMock.findByExternalId.mockResolvedValue(webhook);

            await service.deleteWebhook(FinancialProvider.HIPERBANCO, webhookId, session);

            expect(webhookRepositoryMock.findByExternalId).toHaveBeenCalledWith(webhookId);
            expect(providerHelperMock.delete).toHaveBeenCalledWith(FinancialProvider.HIPERBANCO, webhookId, session);
            expect(webhookRepositoryMock.softDelete).toHaveBeenCalledWith(webhook.id);
        });

        it('should throw NOT_FOUND if webhook does not exist locally', async () => {
            const webhookId = 'webhook-id';
            const session = mockProviderSession();

            webhookRepositoryMock.findByExternalId.mockResolvedValue(null);

            await expect(service.deleteWebhook(FinancialProvider.HIPERBANCO, webhookId, session))
                .rejects.toThrow('Webhook não encontrado localmente');

            expect(providerHelperMock.delete).not.toHaveBeenCalled();
            expect(webhookRepositoryMock.softDelete).not.toHaveBeenCalled();
        });

        it('should propagate error from provider and not delete locally', async () => {
            const webhookId = 'webhook-id';
            const session = mockProviderSession();
            const webhook = { id: 'internal-id', externalId: webhookId };

            webhookRepositoryMock.findByExternalId.mockResolvedValue(webhook);
            providerHelperMock.delete.mockRejectedValue(new Error('Provider error'));

            await expect(service.deleteWebhook(FinancialProvider.HIPERBANCO, webhookId, session))
                .rejects.toThrow('Provider error');

            expect(webhookRepositoryMock.softDelete).not.toHaveBeenCalled();
        });
    });

    describe('RegisterWebhookDto Validation', () => {
        it('should fail validation when name equals eventName', async () => {
            const dto = new RegisterWebhookDto();
            dto.name = 'SAME_NAME';
            dto.eventName = 'SAME_NAME';
            dto.context = WebhookContext.BOLETO;
            dto.uri = 'https://valid.com';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('NotEqual');
        });

        it('should pass validation when name is different from eventName', async () => {
            const dto = new RegisterWebhookDto();
            dto.name = 'MY_WEBHOOK';
            dto.eventName = 'BOLETO_CREATED';
            dto.context = WebhookContext.BOLETO;
            dto.uri = 'https://valid.com';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });
});
