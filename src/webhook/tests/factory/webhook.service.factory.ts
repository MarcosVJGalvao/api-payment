import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { WebhookService } from '../../webhook.service';
import { WebhookProviderHelper } from '../../helpers/webhook-provider.helper';
import { WebhookRepository } from '../../repositories/webhook.repository';
import { AppLoggerService } from '@/common/logger/logger.service';
import { ProviderSessionHelper } from '../../helpers/provider-session.helper';

export async function createWebhookServiceTestFactory() {
  const webhookRepositoryMock = {
    saveWebhook: jest.fn().mockImplementation((provider, dto, response) =>
      Promise.resolve({
        id: 'uuid',
        ...dto,
        providerSlug: provider,
        externalId: response.id,
      }),
    ),
    findById: jest.fn(),
    findByExternalId: jest.fn(),
    findByProvider: jest.fn(),
    findByClientIdAndProvider: jest.fn(),
    findByExternalIdAndClient: jest.fn(),
    softDelete: jest.fn(),
    updateWebhookUri: jest.fn().mockResolvedValue(undefined),
  };

  const providerHelperMock = {
    register: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  };

  const loggerMock = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const providerSessionHelperMock = {
    executeWithRetry: jest
      .fn()
      .mockImplementation((provider, fn) => fn('mock-session')),
  };

  const queueMock = {
    add: jest.fn().mockResolvedValue(undefined),
    process: jest.fn(),
    on: jest.fn(),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      WebhookService,
      { provide: getQueueToken('webhook'), useValue: queueMock },
      { provide: WebhookRepository, useValue: webhookRepositoryMock },
      { provide: WebhookProviderHelper, useValue: providerHelperMock },
      { provide: AppLoggerService, useValue: loggerMock },
      { provide: ProviderSessionHelper, useValue: providerSessionHelperMock },
    ],
  }).compile();

  return {
    webhookService: module.get<WebhookService>(WebhookService),
    webhookRepositoryMock,
    providerHelperMock,
    loggerMock,
    providerSessionHelperMock,
    queueMock,
  };
}
