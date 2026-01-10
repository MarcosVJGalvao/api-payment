/**
 * Interfaces de resposta da API do Hiperbanco
 * Tipagem mínima - apenas campos essenciais são obrigatórios
 */

export interface HiperbancoRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}

export interface HiperbancoAccount {
  id: string;
  status: string;
  branch: string;
  number: string;
  type: string;
}

export interface BankLoginUserData extends Record<string, unknown> {
  id: string;
  accounts: HiperbancoAccount[];
  registerName?: string;
  documentNumber?: string;
  typeAccount?: 'PF' | 'PJ';
}

export interface BankLoginResponse extends Record<string, unknown> {
  access_token: string;
  userData: BankLoginUserData;
}

export interface BackofficeLoginResponse extends Record<string, unknown> {
  access_token: string;
}

export interface RegisterWebhookResponse {
  id: string;
  name: string;
  context: string;
  eventName: string;
  uri: string;
  publicKey: string;
}

export type UpdateWebhookResponse = RegisterWebhookResponse;

export interface WebhookItem {
  id: string;
  name: string;
  eventName: string;
  context: string;
  uri: string;
  publicKey: string;
  createdAt: string;
  updatedAt?: string;
  status: 'Enabled' | 'Disabled';
}

export interface WebhookListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ListWebhooksResponse {
  data: WebhookItem[];
  meta: WebhookListMeta;
}

export interface HiperbancoErrorResponse {
  message?: string;
  errorCode?: string;
  data?: Record<string, unknown>;
}

export interface BoletoEmissionResponse extends Record<string, unknown> {
  id?: string;
  authenticationCode?: string;
  barcode?: string;
  digitable?: string;
  status?: string;
}

export interface BoletoWebhookPayload extends Record<string, unknown> {
  id?: string;
  externalId?: string;
  status?: string;
  authenticationCode?: string;
  barcode?: string;
  digitable?: string;
}

export interface BoletoPayment {
  id: string;
  amount: number;
  paymentChannel: string;
  paidOutDate: string;
}

export interface BoletoAddress {
  addressLine: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface BoletoPayer {
  document: string;
  name: string;
  tradeName?: string;
  address: BoletoAddress;
}

export interface BoletoRecipientFinal {
  document: string;
  name: string;
  tradeName?: string;
  address: BoletoAddress;
}

export interface BoletoAmount {
  currency: string;
  value: number;
}

export interface BoletoInterest {
  startDate: string;
  type: string;
  value: number;
}

export interface BoletoFine {
  startDate: string;
  type: string;
  value: number;
}

export interface BoletoAccount {
  number: string;
  branch: string;
}

export interface BoletoGetDataResponse {
  authenticationCode: string;
  barcode: string;
  updatedAt: string;
  ourNumber: string;
  digitable: string;
  status: string;
  account: BoletoAccount;
  document: string;
  amount: BoletoAmount;
  dueDate: string;
  closePayment: string;
  emissionDate: string;
  type: string;
  payer?: BoletoPayer;
  recipientFinal?: BoletoRecipientFinal;
  payments?: BoletoPayment[] | null;
  interest?: BoletoInterest;
  fine?: BoletoFine;
  alias?: string;
}

export interface BoletoCancelResponse extends Record<string, unknown> {
  message?: string;
  status?: string;
}

// ============ Bill Payment (Pagamento de Contas) ============

export interface BillPaymentRecipient {
  name: string;
  documentNumber: string;
}

export interface BillPaymentPayer {
  name: string;
  documentNumber: string;
}

export interface BillPaymentBusinessHours {
  start: string;
  end: string;
}

export interface BillPaymentCharges {
  interestAmountCalculated: number;
  fineAmountCalculated: number;
  discountAmount: number;
}

export interface BillPaymentValidateResponse extends Record<string, unknown> {
  id: string;
  assignor: string;
  recipient: BillPaymentRecipient;
  payer: BillPaymentPayer;
  businessHours: BillPaymentBusinessHours;
  dueDate: string;
  settleDate: string;
  nextSettle: boolean;
  originalAmount: number;
  amount: number;
  charges: BillPaymentCharges;
  maxAmount: number;
  minAmount: number;
  allowChangeAmount: boolean;
  digitable: string;
  nextBusinessDay: string;
}

export interface BillPaymentConfirmResponse extends Record<string, unknown> {
  authenticationCode: string;
  settleDate: string;
  transactionId: string;
  digitable?: string;
}

export interface BillPaymentDetailResponse extends Record<string, unknown> {
  authenticationCode: string;
  bankAccount: string;
  bankBranch: string;
  description?: string;
  paymentDate: string;
  status: string;
  companyKey: string;
  documentNumber: string;
  confirmedAt: string;
  digitable: string;
  amount: number;
  originalAmount: number;
  totalAmount: number;
  assignor: string;
  recipientDocument: string;
  recipientName: string;
  charges: BillPaymentCharges;
  settleDate: string;
  dueDate: string;
}

// ============ PIX ============

export interface PixKeyItem {
  type: string;
  value: string;
}

/** Resposta da consulta de chaves PIX (array) */
export type PixGetKeysResponse = PixKeyItem[];

/** Resposta do cadastro de chave PIX */
export interface PixRegisterKeyResponse extends Record<string, unknown> {
  addressingKey?: {
    type: string;
    value?: string;
  };
  account?: {
    type: string;
    branch: string;
    number: string;
  };
  message?: string;
}
