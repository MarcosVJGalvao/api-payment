import { WebhookContext } from '../../enums/webhook-context.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { RegisterWebhookDto } from '../../dto/register-webhook.dto';
import { Webhook } from '../../entities/webhook.entity';
import { RegisterWebhookResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';

export const mockRegisterWebhookDto = (): RegisterWebhookDto => ({
    name: 'SANDBOX_BOLETO_CASH_IN',
    context: WebhookContext.BOLETO,
    uri: 'https://meuwebhook.com/123',
    eventName: 'BOLETO_CASH_IN_WAS_RECEIVED',
});

export const mockWebhook = (): Webhook => ({
    id: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
    name: 'SANDBOX_BOLETO_CASH_IN',
    context: WebhookContext.BOLETO,
    eventName: 'BOLETO_CASH_IN_WAS_RECEIVED',
    uri: 'https://meuwebhook.com/123',
    providerSlug: FinancialProvider.HIPERBANCO,
    externalId: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
    publicKey: '872dc2ed-8bee-40b5-8465-5d2953ba76dp',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
});

export const mockRegisterWebhookResponse = (): RegisterWebhookResponse => ({
    id: '89444df2-a1d1-4fe8-ade8-3d03de0fd61m',
    name: 'SANDBOX_BOLETO_CASH_IN',
    context: 'Boleto',
    eventName: 'BOLETO_CASH_IN_WAS_RECEIVED',
    uri: 'https://meuwebhook.com/123',
    publicKey: '872dc2ed-8bee-40b5-8465-5d2953ba76dp',
});

export const mockProviderSession = (): ProviderSession => ({
    sessionId: 'mock-session-id',
    providerSlug: FinancialProvider.HIPERBANCO,
    clientId: 'mock-client-id',
    hiperbancoToken: 'mock-hiperbanco-token',
    loginType: 'backoffice',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000,
});

export const mockUpdateWebhookDto = () => ({
    uri: 'https://nova-url.com/webhook',
});

export const mockUpdateWebhookResponse = () => ({
    ...mockRegisterWebhookResponse(),
    uri: 'https://nova-url.com/webhook',
});
