import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const webhooksBillPaymentManualTag: IManualTag = {
  name: 'Webhooks - BillPayment (Manual)',
  apiTag: 'Webhooks - BillPayment',
  description: [
    '## Webhooks - BillPayment',
    '',
    'Endpoints de recepção/processamento de webhooks de pagamento de contas.',
    '',
    '### Observação',
    '',
    'Normalmente utilizados por provedores/sistemas internos e podem ter requisitos específicos de autenticação/assinatura.',
  ].join('\n'),
};
