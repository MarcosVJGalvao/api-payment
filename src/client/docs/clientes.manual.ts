import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const clientesManualTag: IManualTag = {
  name: 'Clientes (Manual)',
  apiTag: 'Clientes',
  description: [
    '## Clientes',
    '',
    'Gestão de clientes da plataforma (cadastro, consulta, listagem, atualização e remoção).',
    '',
    '### Paginação e filtros',
    '',
    'Endpoints de listagem desta seção podem usar paginação/filtros. Consulte também a seção **Paginação** do manual.',
    '',
    '### Erros comuns',
    '',
    '- `CLIENT_ALREADY_EXISTS` em cadastros duplicados',
    '- `CLIENT_NOT_FOUND` ao consultar/remover registros inexistentes',
  ].join('\n'),
};
