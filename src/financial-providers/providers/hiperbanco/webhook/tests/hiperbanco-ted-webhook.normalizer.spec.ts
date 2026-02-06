import { HiperbancoTedWebhookNormalizer } from '../hiperbanco-ted-webhook.normalizer';
import type { WebhookPayload } from '@/webhook-processor/interfaces/webhook-base.interface';

describe('HiperbancoTedWebhookNormalizer', () => {
  it('normalizes TED cash-out payloads with channel.recipient and document.value', () => {
    const normalizer = new HiperbancoTedWebhookNormalizer();

    const events = [
      {
        entityId: '8fb63329-eda2-4a9c-91a1-f6c8f13c63b8',
        companyKey: 'HIPERBANCO_SANDBOX',
        idempotencyKey: 'c5e5bc8b-b4cd-42d0-ac1e-2c835ccf8849',
        context: 'Ted' as any,
        name: 'TED_CASH_OUT_WAS_DONE',
        timestamp: '2022-11-07T18:27:44.6817634Z',
        correlationId: '8fb63329-eda2-4a9c-91a1-f6c8f13c63b8',
        version: '1.0',
        metadata: { RequestedAt: 1667845664 },
        data: {
          sender: {
            document: { value: '47742663023', type: 'CPF' },
            type: 'Customer',
            name: 'Nísia Floresta',
            account: {
              branch: '0001',
              number: '15164',
              type: 'Checking',
              bank: {
                ispb: '13140088',
                code: '332',
                name: 'Acesso Soluções de Pagamento S.A.',
              },
            },
          },
          authenticationCode: '8fb63329-eda2-4a9c-91a1-f6c8f13c63b8',
          amount: { value: 0.01, currency: 'BRL' },
          channel: {
            name: 'SPB',
            recipient: {
              document: { value: '09992220074', type: 'CPF' },
              type: 'Customer',
              name: 'Quitéria Maria de Jesus',
              account: {
                branch: '0001',
                number: '540108',
                type: 'Checking',
                bank: {
                  ispb: '13140088',
                  code: '332',
                  name: 'Acesso Soluções De Pagamento S.A.',
                },
              },
            },
            controlNumber: 'AB638326341140223360',
          },
        },
      },
    ] satisfies WebhookPayload<any>[];

    const normalized = normalizer.normalizeCashOutDone(events as any, {});
    expect(normalized).toHaveLength(1);

    const normalizedData = normalized[0].data;
    expect(normalizedData.authenticationCode).toBe(
      '8fb63329-eda2-4a9c-91a1-f6c8f13c63b8',
    );
    expect(normalizedData.channel).toBe('SPB');
    expect(normalizedData.amount).toEqual({ value: 0.01, currency: 'BRL' });

    expect(normalizedData.sender?.document).toBe('47742663023');
    expect(normalizedData.sender?.account?.branch).toBe('0001');
    expect(normalizedData.sender?.account?.bank?.ispb).toBe('13140088');
    expect(normalizedData.sender?.account?.bank?.compe).toBe('332');

    expect(normalizedData.recipient?.document).toBe('09992220074');
    expect(normalizedData.recipient?.account?.number).toBe('540108');
    expect(normalizedData.recipient?.account?.bank?.name).toBe(
      'Acesso Soluções De Pagamento S.A.',
    );
  });
});
