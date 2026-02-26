import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const webhooksTedManualTag: IManualTag = {
  name: 'Webhooks - TED (Manual)',
  apiTag: 'Webhooks - TED',
  description: [
    '## Webhooks - TED',
    '',
    'Endpoints de recepção/processamento de eventos TED.',
    '',
    '### Observação',
    '',
    'Esses endpoints normalmente são consumidos por provedores ou serviços internos automatizados.',
  ].join('\n'),
};
