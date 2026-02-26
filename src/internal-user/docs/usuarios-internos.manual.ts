import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const usuariosInternosManualTag: IManualTag = {
  name: 'Usuários Internos (Manual)',
  apiTag: 'Usuários Internos',
  description: [
    '## Usuários Internos',
    '',
    'Endpoints de autenticação e operações destinadas a usuários internos da operação.',
    '',
    '### Autenticação',
    '',
    'Utiliza autenticação **internal-auth** para endpoints protegidos desta área.',
  ].join('\n'),
};
