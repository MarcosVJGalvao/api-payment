import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const auditoriaManualTag: IManualTag = {
  name: 'Auditoria (Manual)',
  description: [
    '## Auditoria',
    '',
    'Todas as operações que modificam dados são auditadas automaticamente pelo sistema.',
    '',
    '### Dados Registrados',
    '',
    '| Campo | Descrição |',
    '|-------|-----------|',
    '| `userId` | Identificador do usuário que realizou a ação |',
    '| `action` | Tipo de operação: `CREATE`, `UPDATE`, `DELETE` |',
    '| `entity` | Entidade modificada (ex: `Boleto`, `PixTransfer`) |',
    '| `entityId` | ID do registro modificado |',
    '| `before` | Estado anterior do registro (para UPDATE e DELETE) |',
    '| `after` | Novo estado do registro (para CREATE e UPDATE) |',
    '| `ipAddress` | IP de origem da requisição |',
    '| `correlationId` | ID de correlação para rastreamento distribuído |',
    '| `createdAt` | Data e hora da ação |',
    '',
    '### Consulta de Auditoria',
    '',
    'Os logs de auditoria podem ser consultados por administradores através do endpoint de auditoria com filtros por entidade, período e usuário.',
  ].join('\n'),
};
