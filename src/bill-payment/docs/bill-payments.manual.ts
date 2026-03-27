import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const billPaymentsManualTag: IManualTag = {
  name: 'Bill Payments (Manual)',
  apiTag: 'Bill Payments',
  description: [
    '## Bill Payments',
    '',
    'Endpoints para validação, consulta e confirmação de pagamentos de contas.',
    '',
    '### Fluxo comum',
    '',
    '1. Validar a conta/pagamento',
    '2. Confirmar a operação',
    '3. Consultar status quando necessário',
    '',
    '### Autenticação',
    '',
    'Utiliza autenticação conforme o contexto do endpoint (ver chip de autenticação na página do endpoint).',
  ].join('\n'),
};
