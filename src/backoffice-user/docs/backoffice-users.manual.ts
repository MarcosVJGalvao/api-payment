import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const backofficeUsersManualTag: IManualTag = {
  name: 'Backoffice Users',
  apiTag: 'Backoffice Users',
  description: [
    '## Backoffice Users',
    '',
    'Endpoints para gestão de usuários de backoffice (criação, listagem e remoção).',
    '',
    '### Funcionalidades',
    '',
    '- Criar usuário de backoffice',
    '- Listar usuários de backoffice',
    '- Remover (soft delete) usuário de backoffice',
    '',
    '### Importante',
    '',
    '- Valide os requisitos de autenticação e permissões em cada endpoint',
    '- Consulte a seção de erros para códigos específicos por operação',
  ].join('\n'),
};
