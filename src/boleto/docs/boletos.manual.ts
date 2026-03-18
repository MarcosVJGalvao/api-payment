import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const boletosManualTag: IManualTag = {
  name: 'Boletos',
  apiTag: 'Boletos',
  description: `## Boletos Bancarios

O modulo de Boletos permite **emissao**, **consulta**, **listagem** e **cancelamento** de boletos bancarios atraves dos provedores financeiros integrados.

### Tipos de Boleto

| Tipo | Descricao | Uso |
|------|-----------|-----|
| **Deposit** | Boleto de deposito | Receber depositos na conta |
| **Levy** | Boleto de cobranca | Cobrar valores de terceiros |

### Fluxo de Emissao

1. Autenticar com o provedor financeiro via \`POST /auth/login\`
2. Emitir o boleto via \`POST /boleto/{provider}\` informando os dados
3. O provedor retorna o **codigo de barras**, **linha digitavel** e **codigo de autenticacao**
4. O boleto fica com status \`REGISTERED\` ate ser pago ou cancelado
5. Para cancelar, usar \`DELETE /boleto/{id}\` com o \`internalId\` retornado na emissao

### Autenticacao e Headers

Os endpoints de Boletos normalmente exigem:

- Autenticacao \`provider-auth\`
- Header \`X-Client-Id\` (identificacao do cliente)
- Contexto de conta (\`X-Account-Id\` ou conta resolvida pela sessao do provedor, conforme fluxo)

Consulte a secao **Headers Necessarios** de cada endpoint para confirmar os requisitos exatos.

### Regras de Negocio

- A **data de vencimento** (\`dueDate\`) deve ser uma data futura
- Para boletos do tipo **Levy**, e obrigatorio informar os dados do **pagador** (\`payer\`)
- O campo \`closePayment\` define a data limite de pagamento apos o vencimento
- Cada boleto recebe um \`internalId\` (UUID) para rastreamento interno
- O cancelamento usa esse \`internalId\`; o provider e resolvido internamente pelo registro salvo

> **Importante:** O cancelamento de um boleto so e possivel enquanto ele estiver com status \`REGISTERED\`. Boletos ja pagos nao podem ser cancelados.
`,
};
