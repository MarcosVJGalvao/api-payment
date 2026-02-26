import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const tedManualTag: IManualTag = {
  name: 'TED (Manual)',
  apiTag: 'TED',
  description: [
    '## TED',
    '',
    'Endpoints para transferências TED, consulta individual e listagem.',
    '',
    '### Fluxo comum',
    '',
    '1. Solicitar transferência TED',
    '2. Consultar status por ID',
    '3. Listar transferências com filtros/paginação',
  ].join('\n'),
};
