import { BoletoStatus } from '../enums/boleto-status.enum';

export interface IUpdateBoleto {
    status?: BoletoStatus;
    authenticationCode?: string;
    barcode?: string;
    digitable?: string;
}
