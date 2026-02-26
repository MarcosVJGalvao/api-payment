import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const permissoesManualTag: IManualTag = {
  name: 'Permissões (Manual)',
  apiTag: 'Permissões',
  description: [
    '## Permissões',
    '',
    'Gestão de permissões, associação a usuários e operações relacionadas a controle de acesso.',
    '',
    '### Boas práticas de integração',
    '',
    '- Usar IDs retornados pelas APIs de roles/permissões',
    '- Tratar `PERMISSION_NOT_FOUND` e `ROLE_NOT_FOUND` explicitamente',
    '- Atualizar cache local de permissões após mudanças',
  ].join('\n'),
};
