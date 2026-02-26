import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

// Importações dos manual tags de cada módulo
import { introducaoManualTag } from '@/swagger/docs/manual/introducao.manual';
import { autenticacaoManualTag } from '@/backoffice-user/docs/autenticacao.manual';
import { errosManualTag } from '@/common/errors/docs/erros.manual';
import { paginacaoManualTag } from '@/common/base-query/docs/paginacao.manual';
import { idempotenciaManualTag } from '@/swagger/docs/manual/idempotencia.manual';
import { modulosPagamentoManualTag } from '@/swagger/docs/manual/modulos-pagamento.manual';
import { webhooksManualTag } from '@/webhook/docs/webhooks.manual';
import { rateLimitingManualTag } from '@/swagger/docs/manual/rate-limiting.manual';
import { auditoriaManualTag } from '@/common/audit/docs/auditoria.manual';

/**
 * Registro centralizado de todas as tags de documentação narrativa (manual).
 * A ordem dos itens define a ordem de exibição no sidebar do Scalar.
 *
 * Para adicionar uma nova seção ao manual:
 * 1. Crie um arquivo `*.manual.ts` na pasta `docs/` do módulo correspondente
 * 2. Exporte um objeto `IManualTag` com `name` e `description`
 * 3. Importe e adicione ao array abaixo
 */
export function getManualTags(): IManualTag[] {
  return [
    introducaoManualTag,
    autenticacaoManualTag,
    errosManualTag,
    paginacaoManualTag,
    idempotenciaManualTag,
    modulosPagamentoManualTag,
    webhooksManualTag,
    rateLimitingManualTag,
    auditoriaManualTag,
  ];
}
