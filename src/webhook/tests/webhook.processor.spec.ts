import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { WebhookProcessor } from '../webhook.processor';

describe('WebhookProcessor', () => {
  const registrationSuccessQueueMock = {
    add: jest.fn().mockResolvedValue(undefined),
  };
  const loggerMock = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const providerHelperMock = {
    register: jest.fn().mockResolvedValue({
      id: 'provider-webhook-id',
      name: 'ACME_WEBHOOK',
      context: 'Pix',
      eventName: 'PIX_CASH_IN_WAS_CLEARED',
      uri: 'https://event.callback/webhook',
      publicKey: 'public-key',
    }),
  };
  const providerSessionHelperMock = {
    executeWithRetry: jest
      .fn()
      .mockImplementation((provider, callback) => callback({})),
  };
  const webhookRepositoryMock = {
    saveWebhook: jest.fn().mockResolvedValue({
      id: 'webhook-id',
      name: 'ACME_WEBHOOK',
      context: 'Pix',
      eventName: 'PIX_CASH_IN_WAS_CLEARED',
      uri: 'https://event.callback/webhook',
      providerSlug: FinancialProvider.HIPERBANCO,
      externalId: 'provider-webhook-id',
      publicKey: 'public-key',
      registrationCallbackUri: 'https://integration.callback/success',
    }),
    findByIdWithCallbackSecret: jest.fn().mockResolvedValue({
      registrationCallbackSecret: 'callback-secret',
    }),
  };
  const providerRegistrationNormalizerMock = {
    normalize: jest.fn().mockReturnValue({
      providerWebhookId: 'provider-webhook-id',
      providerPublicKey: 'public-key',
      providerName: 'ACME_WEBHOOK',
      providerRawResponse: { id: 'provider-webhook-id' },
    }),
  };

  const processor = new WebhookProcessor(
    registrationSuccessQueueMock as any,
    loggerMock as any,
    providerHelperMock as any,
    providerSessionHelperMock as any,
    providerRegistrationNormalizerMock as any,
    webhookRepositoryMock as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enqueue registration success notification after successful registration', async () => {
    await processor.handleRegistration({
      data: {
        provider: FinancialProvider.HIPERBANCO,
        dto: {
          name: 'webhook_name',
          context: 'Pix',
          uri: 'https://event.callback/webhook',
          eventName: 'PIX_CASH_IN_WAS_CLEARED',
          registrationCallbackUri: 'https://integration.callback/success',
          registrationCallbackSecret: 'callback-secret',
        },
      },
    } as any);

    expect(webhookRepositoryMock.saveWebhook).toHaveBeenCalled();
    expect(providerRegistrationNormalizerMock.normalize).toHaveBeenCalled();
    expect(registrationSuccessQueueMock.add).toHaveBeenCalledTimes(1);
    expect(
      registrationSuccessQueueMock.add.mock.calls[0][0].payload.event,
    ).toBe('WEBHOOK_REGISTRATION_SUCCEEDED');
  });

  it('should not enqueue success notification when registration callback uri is absent', async () => {
    webhookRepositoryMock.saveWebhook.mockResolvedValueOnce({
      id: 'webhook-id',
      name: 'ACME_WEBHOOK',
      context: 'Pix',
      eventName: 'PIX_CASH_IN_WAS_CLEARED',
      uri: 'https://event.callback/webhook',
      providerSlug: FinancialProvider.HIPERBANCO,
      externalId: 'provider-webhook-id',
      publicKey: 'public-key',
      registrationCallbackUri: null,
    });

    await processor.handleRegistration({
      data: {
        provider: FinancialProvider.HIPERBANCO,
        dto: {
          name: 'webhook_name',
          context: 'Pix',
          uri: 'https://event.callback/webhook',
          eventName: 'PIX_CASH_IN_WAS_CLEARED',
        },
      },
    } as any);

    expect(registrationSuccessQueueMock.add).not.toHaveBeenCalled();
    expect(loggerMock.warn).toHaveBeenCalled();
  });
});
