import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionSemanticStatus } from '../enums/transaction-semantic-status.enum';

/**
 * Retorna o status semântico correspondente ao status detalhado.
 *
 * @param status Status detalhado da transação
 * @returns Status semântico
 */
export function getSemanticStatus(
  status: TransactionStatus,
): TransactionSemanticStatus {
  switch (status) {
    case TransactionStatus.CREATED:
    case TransactionStatus.PENDING:
    case TransactionStatus.IN_PROCESS:
    case TransactionStatus.REFUND_PENDING:
      return TransactionSemanticStatus.PROCESSING;

    case TransactionStatus.DONE:
      return TransactionSemanticStatus.SUCCESS;

    case TransactionStatus.UNDONE:
    case TransactionStatus.CANCELED:
    case TransactionStatus.FAILED:
    case TransactionStatus.REPROVED:
      return TransactionSemanticStatus.FAILED;

    case TransactionStatus.REFUNDED:
      return TransactionSemanticStatus.REFUNDED;

    default:
      return TransactionSemanticStatus.PROCESSING; // Default fallback
  }
}

/**
 * Retorna a lista de status detalhados que correspondem a um status semântico.
 * Útil para filtros de API.
 *
 * @param semanticStatus Status semântico
 * @returns Array de status detalhados
 */
export function getDetailedStatuses(
  semanticStatus: TransactionSemanticStatus,
): TransactionStatus[] {
  switch (semanticStatus) {
    case TransactionSemanticStatus.PROCESSING:
      return [
        TransactionStatus.CREATED,
        TransactionStatus.PENDING,
        TransactionStatus.IN_PROCESS,
        TransactionStatus.REFUND_PENDING,
      ];

    case TransactionSemanticStatus.SUCCESS:
      return [TransactionStatus.DONE];

    case TransactionSemanticStatus.FAILED:
      return [
        TransactionStatus.UNDONE,
        TransactionStatus.CANCELED,
        TransactionStatus.FAILED,
        TransactionStatus.REPROVED,
      ];

    case TransactionSemanticStatus.REFUNDED:
      return [TransactionStatus.REFUNDED];

    default:
      return [];
  }
}
