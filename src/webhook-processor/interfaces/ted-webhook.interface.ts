import { WebhookPayload } from './webhook-base.interface';

export interface TedCashOutData {
  authenticationCode: string;
  amount: {
    value: number;
    currency: string;
  };
  description?: string;
  status: string;
  channel?: string;
  paymentDate?: string;
  refusalReason?: string;
  sender?: {
    document: string;
    name: string;
    account: {
      branch: string;
      number: string;
      bank: {
        ispb: string;
        name: string;
        compe: string;
      };
    };
  };
  recipient?: {
    document: string;
    name: string;
    account: {
      branch: string;
      number: string;
      bank: {
        ispb: string;
        name: string;
        compe: string;
      };
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TedCashInData {
  authenticationCode: string;
  amount: {
    value: number;
    currency: string;
  };
  description?: string;
  channel?: string;
  sender?: {
    document: string;
    name: string;
    account: {
      branch: string;
      number: string;
      bank: {
        ispb: string;
        name: string;
        compe: string;
      };
    };
  };
  recipient?: {
    document: string;
    name: string;
    account: {
      branch: string;
      number: string;
    };
  };
  createdAt?: string;
}

export interface TedRefundData {
  authenticationCode: string;
  originalAuthenticationCode?: string;
  amount: {
    value: number;
    currency: string;
  };
  description?: string;
  refundReason?: string;
  errorCode?: string;
  errorReason?: string;
  sender?: {
    document: string;
    name: string;
  };
  recipient?: {
    document: string;
    name: string;
  };
  createdAt?: string;
}

export type TedCashOutPayload = WebhookPayload<TedCashOutData>;
export type TedCashInPayload = WebhookPayload<TedCashInData>;
export type TedRefundPayload = WebhookPayload<TedRefundData>;
