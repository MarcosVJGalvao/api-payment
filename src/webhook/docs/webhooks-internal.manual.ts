import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const webhooksInternalManualTag: IManualTag = {
  name: 'Webhooks (Internal) (Manual)',
  apiTag: 'Webhooks (Internal)',
  description: [
    '## Webhooks (Internal)',
    '',
    'Endpoints internos para processamento/controle operacional de webhooks.',
    '',
    '### Público-alvo',
    '',
    'Uso interno da operação/plataforma. Esses endpoints não são destinados à integração pública.',
  ].join('\n'),
};
