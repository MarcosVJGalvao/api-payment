import { AmountData } from './webhook-base.interface';

export interface BoletoChannelData {
  ourNumber: string;
}

export interface BoletoWebhookData {
  authenticationCode: string;
  barcode?: string;
  digitable?: string;
  amount: AmountData;
  channel?: BoletoChannelData;
  reason?: string;
  createdAt?: string;
}
