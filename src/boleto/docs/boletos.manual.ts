import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const boletosManualTag: IManualTag = {
  name: 'Boletos',
  apiTag: 'Boletos',
  description: `## Boletos Bancários

O módulo de Boletos permite **emissão**, **consulta**, **listagem** e **cancelamento** de boletos bancários através dos provedores financeiros integrados.

### Tipos de Boleto

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **Deposit** | Boleto de depósito | Receber depósitos na conta |
| **Levy** | Boleto de cobrança | Cobrar valores de terceiros |

### Fluxo de Emissão

1. Autenticar com o provedor financeiro via \`POST /auth/login\`
2. Emitir o boleto via \`POST /boleto/{provider}\` informando os dados
3. O provedor retorna o **código de barras**, **linha digitável** e **código de autenticação**
4. O boleto fica com status \`REGISTERED\` até ser pago ou cancelado

### Regras de Negócio

- A **data de vencimento** (\`dueDate\`) deve ser uma data futura
- Para boletos do tipo **Levy**, é obrigatório informar os dados do **pagador** (\`payer\`)
- O campo \`closePayment\` define a data limite de pagamento após o vencimento
- Cada boleto recebe um \`internalId\` (UUID) para rastreamento interno

> **Importante:** O cancelamento de um boleto só é possível enquanto ele estiver com status \`REGISTERED\`. Boletos já pagos não podem ser cancelados.
`,
};
