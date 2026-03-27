import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const provedoresFinanceirosManualTag: IManualTag = {
  name: 'Provedores Financeiros (Manual)',
  apiTag: 'Provedores Financeiros',
  description: [
    '## Provedores Financeiros',
    '',
    'Configuração e autenticação de integração com provedores financeiros.',
    '',
    '### Objetivo',
    '',
    '- Configurar credenciais e parâmetros por provedor',
    '- Executar login técnico/backoffice no provedor',
    '- Consultar configuração atual',
    '',
    '### Observação',
    '',
    'Falhas de comunicação ou autenticação com provedores podem retornar códigos específicos como `PROVIDER_AUTH_FAILED` e `EXTERNAL_SERVICE_*`.',
  ].join('\n'),
};
