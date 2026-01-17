import { AmountData, ParticipantData } from './webhook-base.interface';

/**
 * Dados do canal PIX para cash-in.
 */
export interface PixCashInChannelData {
  name: string;
  end2EndId: string;
  receiverReconciliationId?: string;
  pixInitializationType?: string;
  pixPaymentPriority?: string;
  pixPaymentPriorityType?: string;
  pixPaymentPurpose?: string;
  sender: ParticipantData;
}

/**
 * Dados da chave de endereçamento.
 */
export interface AddressingKeyData {
  value: string;
  type: string;
}

/**
 * Payload de PIX_CASH_IN_WAS_RECEIVED.
 */
export interface PixCashInReceivedData {
  authenticationCode: string;
  amount: AmountData;
  description?: string;
  addressingKey?: AddressingKeyData;
  recipient: ParticipantData;
  channel: PixCashInChannelData;
  createdAt: string;
}

/**
 * Payload de PIX_CASH_IN_WAS_CLEARED.
 * Note: authenticationCode may not be present in data, use entityId from envelope as fallback.
 */
export interface PixCashInClearedData {
  authenticationCode?: string;
  amount: AmountData;
  description?: string;
  recipient: ParticipantData;
  channel: {
    name: string;
    end2EndId: string;
    sender: ParticipantData;
  };
  receiverReconciliationId?: string;
  pixInitializationType?: string;
  pixPaymentPriority?: string;
  pixPaymentPriorityType?: string;
  pixPaymentPurpose?: string;
}

/**
 * Dados do canal PIX para cash-out.
 */
export interface PixCashOutChannelData {
  name: string;
  endToEndId: string;
  initializationType?: string;
  paymentPurpose?: string;
  paymentPriority?: string;
  paymentPriorityType?: string;
  isPixOpenBanking?: boolean;
  isInternal?: boolean;
  refusalReason?: string;
  destination: ParticipantData;
}

/**
 * Payload de PIX_CASHOUT_WAS_COMPLETED/CANCELED/UNDONE.
 */
export interface PixCashOutData {
  authenticationCode: string;
  amount: AmountData;
  description?: string;
  sender: ParticipantData;
  channel: PixCashOutChannelData;
  paymentDate: string;
  isRefund: boolean;
  endToEndIdOriginal?: string;
}

/**
 * Dados do canal PIX para refund.
 */
export interface PixRefundChannelData {
  name: string;
  end2EndId: string;
  end2EndIdOriginal: string;
  refundReason?: string;
  errorCode?: string;
  errorReason?: string;
  sender: ParticipantData;
}

/**
 * Payload de PIX_REFUND_WAS_RECEIVED/CLEARED.
 */
export interface PixRefundData {
  authenticationCode: string;
  amount: AmountData;
  description?: string;
  recipient: ParticipantData;
  channel: PixRefundChannelData;
  createdAt: string;
}

/**
 * Dados do recebedor do QR Code.
 */
export interface PixQrCodeRecipientData {
  type: string;
  documentNumber: string;
  name: string;
}

/**
 * Payload de PIX_QRCODE_WAS_CREATED.
 */
export interface PixQrCodeCreatedData {
  partnerKey: string;
  conciliationId: string;
  addressingKey: AddressingKeyData;
  amount: number;
  singlePayment: boolean;
  type: 'STATIC' | 'DYNAMIC';
  purpose: string;
  encodedValue: string;
  changeAmountType: string;
  format: string;
  createdAt: string;
  expiresAt?: string;
  paymentDateLimit?: string;
  recipient: PixQrCodeRecipientData;
}
