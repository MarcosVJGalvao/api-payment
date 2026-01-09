import { IAccount } from './account.interface';

export interface ICancelBoleto {
    authenticationCode: string;
    account: IAccount;
}
