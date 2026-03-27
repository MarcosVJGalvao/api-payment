import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const transacoesManualTag: IManualTag = {
  name: 'Transações (Manual)',
  apiTag: 'Transações',
  description: [
    '## Transações',
    '',
    'Consulta de transações financeiras consolidadas da plataforma.',
    '',
    '### Consultas',
    '',
    '- Listagem com filtros',
    '- Consulta por identificador',
    '',
    '### Paginação',
    '',
    'Consulte a seção **Paginação** para comportamento de `page`, `limit`, ordenação e filtros.',
  ].join('\n'),
};
