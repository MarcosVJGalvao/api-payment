import { BoletoType } from '../enums/boleto-type.enum';
import { IAccount } from './account.interface';
import { IPayer } from './payer.interface';
import { IInterest } from './interest.interface';
import { IFine } from './fine.interface';
import { IDiscount } from './discount.interface';

export interface ICreateBoleto {
  alias?: string;
  account: IAccount;
  documentNumber: string;
  amount: number;
  dueDate: string;
  closePayment?: string;
  type: BoletoType;
  payer?: IPayer;
  interest?: IInterest;
  fine?: IFine;
  discount?: IDiscount;
}
