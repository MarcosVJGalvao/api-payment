import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const rolesManualTag: IManualTag = {
  name: 'Roles (Manual)',
  apiTag: 'Roles',
  description: [
    '## Roles',
    '',
    'Endpoints para criação, consulta, atualização e remoção de papéis (roles).',
    '',
    '### Relação com Permissões',
    '',
    'Roles agrupam permissões e podem ser atribuídas a usuários. Consulte também a seção **Permissões**.',
  ].join('\n'),
};
