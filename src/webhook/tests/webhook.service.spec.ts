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
