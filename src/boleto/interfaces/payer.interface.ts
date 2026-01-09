import { IPayerAddress } from './payer-address.interface';

export interface IPayer {
  document: string;
  name: string;
  tradeName?: string;
  address: IPayerAddress;
}
