import { Repository } from 'typeorm';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixRefund } from '@/pix/entities/pix-refund.entity';
import { PixQrCode } from '@/pix/entities/pix-qr-code.entity';
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { TedTransfer } from '@/ted/entities/ted-transfer.entity';
import { TedCashIn } from '@/ted/entities/ted-cash-in.entity';
import { TedRefund } from '@/ted/entities/ted-refund.entity';

/**
 * Interface para configurar os repositórios usados na hidratação de transações
 */
export interface IHydrationRepositories {
  pixCashIn: Repository<PixCashIn>;
  pixTransfer: Repository<PixTransfer>;
  pixRefund: Repository<PixRefund>;
  pixQrCode: Repository<PixQrCode>;
  boleto: Repository<Boleto>;
  billPayment: Repository<BillPayment>;
  tedTransfer: Repository<TedTransfer>;
  tedCashIn: Repository<TedCashIn>;
  tedRefund: Repository<TedRefund>;
}
