import { WebhookService } from '../webhook.service';
import { createWebhookServiceTestFactory } from './factory/webhook.service.factory';
import {
  mockRegisterWebhookDto,
  mockRegisterWebhookResponse,
} from './mocks/webhook.mock';
import { validate } from 'class-validator';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { WebhookContext } from '../enums/webhook-context.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';

describe('WebhookService', () => {
  let service: WebhookService;
  let webhookRepositoryMock: any;
  let providerHelperMock: any;
  let queueMock: any;
  let providerSessionHelperMock: any;

  beforeEach(async () => {
    const factory = await createWebhookServiceTestFactory();
    service = factory.webhookService;
    webhookRepositoryMock = factory.webhookRepositoryMock;
    providerHelperMock = factory.providerHelperMock;
    queueMock = factory.queueMock;
    providerSessionHelperMock = factory.providerSessionHelperMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerWebhook', () => {
    it('should queue webhook registration and return processing status', async () => {
      const dto = mockRegisterWebhookDto();
      const clientId = 'test-client-id';

      const result = await service.registerWebhook(
        FinancialProvider.HIPERBANCO,
        dto,
        clientId,
      );

      expect(queueMock.add).toHaveBeenCalledWith({
        provider: FinancialProvider.HIPERBANCO,
        dto,
        clientId,
      });
      expect(result).toEqual({
        message: 'Webhook registration queued',
        status: 'PROCESSING',
      });
    });
  });

  describe('listWebhooks', () => {
    it('should return webhooks from repository', async () => {
      const clientId = 'test-client-id';
      const expectedWebhooks = [{ id: 'webhook-1' }, { id: 'webhook-2' }];

      webhookRepositoryMock.findByClientIdAndProvider.mockResolvedValue(
        expectedWebhooks,
      );

      const result = await service.listWebhooks(
        FinancialProvider.HIPERBANCO,
        clientId,
      );

      expect(
        webhookRepositoryMock.findByClientIdAndProvider,
      ).toHaveBeenCalledWith(clientId, FinancialProvider.HIPERBANCO);
      expect(result).toEqual(expectedWebhooks);
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook via provider helper and update repository', async () => {
      const webhookId = 'webhook-id';
      const dto = { uri: 'https://new-uri.com' };
      const clientId = 'test-client-id';
      const expectedResponse = {
        ...mockRegisterWebhookResponse(),
        uri: dto.uri,
      };

      webhookRepositoryMock.findByExternalIdAndClient.mockResolvedValue({
        id: 'internal-id',
        externalId: webhookId,
      });
      providerHelperMock.update.mockResolvedValue(expectedResponse);
      providerSessionHelperMock.executeWithRetry.mockImplementation(
        (provider, fn) => fn('mock-session'),
      );

      const result = await service.updateWebhook(
        FinancialProvider.HIPERBANCO,
        webhookId,
        dto,
        clientId,
      );

      expect(
        webhookRepositoryMock.findByExternalIdAndClient,
      ).toHaveBeenCalledWith(webhookId, clientId);
      expect(providerSessionHelperMock.executeWithRetry).toHaveBeenCalledWith(
        FinancialProvider.HIPERBANCO,
        expect.any(Function),
      );
      expect(webhookRepositoryMock.updateWebhookUri).toHaveBeenCalledWith(
        webhookId,
        dto.uri,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should throw NOT_FOUND if webhook does not exist', async () => {
      const webhookId = 'webhook-id';
      const dto = { uri: 'https://new-uri.com' };
      const clientId = 'test-client-id';

      webhookRepositoryMock.findByExternalIdAndClient.mockResolvedValue(null);

      await expect(
        service.updateWebhook(
          FinancialProvider.HIPERBANCO,
          webhookId,
          dto,
          clientId,
        ),
      ).rejects.toThrow(CustomHttpException);

      expect(webhookRepositoryMock.updateWebhookUri).not.toHaveBeenCalled();
    });

    it('should propagate error from provider helper and not update repository', async () => {
      const webhookId = 'webhook-id';
      const dto = { uri: 'https://new-uri.com' };
      const clientId = 'test-client-id';

      webhookRepositoryMock.findByExternalIdAndClient.mockResolvedValue({
        id: 'internal-id',
        externalId: webhookId,
      });
      providerSessionHelperMock.executeWithRetry.mockRejectedValue(
        new Error('Provider error'),
      );

      await expect(
        service.updateWebhook(
          FinancialProvider.HIPERBANCO,
          webhookId,
          dto,
          clientId,
        ),
      ).rejects.toThrow('Provider error');

      expect(webhookRepositoryMock.updateWebhookUri).not.toHaveBeenCalled();
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook via provider helper and soft delete from repository', async () => {
      const webhookId = 'webhook-id';
      const clientId = 'test-client-id';
      const webhook = { id: 'internal-id', externalId: webhookId };

      webhookRepositoryMock.findByExternalIdAndClient.mockResolvedValue(
        webhook,
      );
      providerSessionHelperMock.executeWithRetry.mockImplementation(
        (provider, fn) => fn('mock-session'),
      );

      await service.deleteWebhook(
        FinancialProvider.HIPERBANCO,
        webhookId,
        clientId,
      );

      expect(
        webhookRepositoryMock.findByExternalIdAndClient,
      ).toHaveBeenCalledWith(webhookId, clientId);
      expect(providerSessionHelperMock.executeWithRetry).toHaveBeenCalledWith(
        FinancialProvider.HIPERBANCO,
        expect.any(Function),
      );
      expect(webhookRepositoryMock.softDelete).toHaveBeenCalledWith(webhook.id);
    });

    it('should throw NOT_FOUND if webhook does not exist locally', async () => {
      const webhookId = 'webhook-id';
      const clientId = 'test-client-id';

      webhookRepositoryMock.findByExternalIdAndClient.mockResolvedValue(null);

      await expect(
        service.deleteWebhook(
          FinancialProvider.HIPERBANCO,
          webhookId,
          clientId,
        ),
      ).rejects.toThrow(
        'Webhook não encontrado ou não pertence a este cliente',
      );

      expect(providerSessionHelperMock.executeWithRetry).not.toHaveBeenCalled();
      expect(webhookRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it('should propagate error from provider and not delete locally', async () => {
      const webhookId = 'webhook-id';
      const clientId = 'test-client-id';
      const webhook = { id: 'internal-id', externalId: webhookId };

      webhookRepositoryMock.findByExternalIdAndClient.mockResolvedValue(
        webhook,
      );
      providerSessionHelperMock.executeWithRetry.mockRejectedValue(
        new Error('Provider error'),
      );

      await expect(
        service.deleteWebhook(
          FinancialProvider.HIPERBANCO,
          webhookId,
          clientId,
        ),
      ).rejects.toThrow('Provider error');

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
