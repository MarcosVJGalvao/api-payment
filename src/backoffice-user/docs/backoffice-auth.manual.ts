import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const backofficeAuthOverviewManualTag: IManualTag = {
  name: 'Backoffice Auth',
  apiTag: 'Backoffice Auth',
  description: [
    '## Backoffice Auth',
    '',
    'Endpoints de autenticação para usuários de backoffice.',
    '',
    '### Objetivo',
    '',
    '- Realizar login de usuário backoffice',
    '- Permitir reset de senha',
    '',
    '### Observações',
    '',
    '- Consulte a documentação de cada endpoint para requisitos de headers e payload',
    '- Os códigos de erro específicos são exibidos na seção `Erros` de cada operação',
  ].join('\n'),
};
