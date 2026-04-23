import { of } from 'rxjs';
import { WebhookRegistrationSuccessProcessor } from '../webhook-registration-success.processor';

describe('WebhookRegistrationSuccessProcessor', () => {
  const httpServiceMock = {
    post: jest.fn(),
  };
  const loggerMock = {
    log: jest.fn(),
    warn: jest.fn(),
  };

  const processor = new WebhookRegistrationSuccessProcessor(
    httpServiceMock as any,
    loggerMock as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    httpServiceMock.post.mockReturnValue(of({ status: 200 }));
  });

  it('should skip delivery when callback uri is missing', async () => {
    await processor.handle({
      data: {
        webhookId: 'webhook-id',
        callbackUri: '',
        callbackSecret: null,
        payload: {
          event: 'WEBHOOK_REGISTRATION_SUCCEEDED',
          status: 'SUCCESS',
          provider: 'hiperbanco',
          clientId: 'client-id',
          webhookId: 'webhook-id',
          providerWebhookId: 'provider-webhook-id',
          name: 'WEBHOOK_NAME',
          context: 'Pix',
          eventName: 'PIX_CASH_IN_WAS_CLEARED',
          uri: 'https://callback.test/webhook',
          occurredAt: new Date().toISOString(),
        },
      },
    } as any);

    expect(httpServiceMock.post).not.toHaveBeenCalled();
    expect(loggerMock.warn).toHaveBeenCalled();
  });

  it('should send delivery with expected headers', async () => {
    await processor.handle({
      data: {
        webhookId: 'webhook-id',
        callbackUri: 'https://integration.test/webhooks/register-success',
        callbackSecret: 'test-secret',
        payload: {
          event: 'WEBHOOK_REGISTRATION_SUCCEEDED',
          status: 'SUCCESS',
          provider: 'hiperbanco',
          clientId: 'client-id',
          webhookId: 'webhook-id',
          providerWebhookId: 'provider-webhook-id',
          name: 'WEBHOOK_NAME',
          context: 'Pix',
          eventName: 'PIX_CASH_IN_WAS_CLEARED',
          uri: 'https://callback.test/webhook',
          occurredAt: new Date().toISOString(),
        },
      },
    } as any);

    expect(httpServiceMock.post).toHaveBeenCalledTimes(1);
    const [, , config] = httpServiceMock.post.mock.calls[0];
    expect(config.headers['X-Webhook-Event']).toBe(
      'WEBHOOK_REGISTRATION_SUCCEEDED',
    );
    expect(config.headers['X-Webhook-Delivery-Id']).toBeDefined();
    expect(config.headers['X-Webhook-Timestamp']).toBeDefined();
    expect(config.headers['X-Webhook-Signature']).toBeDefined();
  });
});
