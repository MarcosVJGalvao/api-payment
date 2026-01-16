import { AmountData, ParticipantData } from './webhook-base.interface';

export interface BillPaymentErrorData {
  code: string;
  message: string;
}

/**
 * Dados de encargos calculados
 */
export interface BillPaymentChargesData {
  interestAmountCalculated?: AmountData;
  fineAmountCalculated?: AmountData;
  discountAmount?: AmountData;
}

/**
 * Dados do webhook de pagamento de conta.
 * Contém todos os campos possíveis que podem vir nos diferentes eventos.
 */
export interface BillPaymentWebhookData {
  authenticationCode: string;
  paymentStatus?: string;
  paymentType?: string;

  /** ID da transação no provedor (vem no RECEIVED) */
  transactionId?: number;

  /** ID de confirmação da transação (vem no CREATED) */
  confirmationTransactionId?: number;

  confirmedAt?: string;
  settleDate?: string;
  paymentDate?: string;
  updatedAt?: string;
  createdAt?: string;
  dueDate?: string;

  /** Nome do cedente (ex: "BANCO ITAU S.A.") */
  assignor?: string;

  /** Tipo de compensação (ex: "Compensation", "Concessionaire") */
  type?: string;

  /** Dados do beneficiário */
  recipient?: ParticipantData;

  /** Dados da conta utilizada para pagamento */
  account?: {
    branch: string;
    number: string;
    bank?: {
      ispb: string;
      code: string;
      name: string;
    };
  };

  /** Linha digitável (pode vir diferente da original após validação) */
  digitable?: string;

  /** Descrição do pagamento */
  description?: string;

  /** Valor efetivamente pago */
  amount?: AmountData;

  /** Valor original do título */
  originalAmount?: AmountData;

  /** Encargos calculados (juros, multa, desconto) */
  charges?: BillPaymentChargesData;

  /** Dados de erro (HAS_FAILED) */
  error?: BillPaymentErrorData;

  /** Motivo de cancelamento (WAS_CANCELLED) */
  reason?: string;

  /** Documento do pagador (WAS_CREATED) */
  document?: {
    value: string;
    type: string;
  };
}
