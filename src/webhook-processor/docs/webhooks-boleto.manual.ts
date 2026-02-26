import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const webhooksBoletoManualTag: IManualTag = {
  name: 'Webhooks - Boleto (Manual)',
  apiTag: 'Webhooks - Boleto',
  description: [
    '## Webhooks - Boleto',
    '',
    'Endpoints de recepção/processamento de webhooks relacionados a boletos.',
    '',
    '### Casos comuns',
    '',
    '- Atualização de status',
    '- Liquidação',
    '- Cancelamento/baixa',
  ].join('\n'),
};
