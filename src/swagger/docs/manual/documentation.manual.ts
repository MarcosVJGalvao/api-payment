import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const documentationManualTag: IManualTag = {
  name: 'Documentation (Manual)',
  apiTag: 'Documentation',
  description: [
    '## Documentation',
    '',
    'Endpoints utilitários de documentação/OpenAPI disponibilizados pela aplicação.',
    '',
    '### Uso comum',
    '',
    '- Obter JSON OpenAPI para integração com ferramentas',
    '- Validar schemas e endpoints em pipelines',
  ].join('\n'),
};
