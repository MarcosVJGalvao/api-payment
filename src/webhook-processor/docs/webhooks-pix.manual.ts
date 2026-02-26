import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const webhooksPixManualTag: IManualTag = {
  name: 'Webhooks - PIX (Manual)',
  apiTag: 'Webhooks - PIX',
  description: [
    '## Webhooks - PIX',
    '',
    'Endpoints de recepção/processamento de eventos PIX enviados por provedores.',
    '',
    '### Objetivo',
    '',
    'Atualizar estados internos de operações PIX com base em eventos assíncronos.',
  ].join('\n'),
};
