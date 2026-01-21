import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixRefund } from '@/pix/entities/pix-refund.entity';
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { PixQrCode } from '@/pix/entities/pix-qr-code.entity';
import { TedTransfer } from '@/ted/entities/ted-transfer.entity';
import { TedCashIn } from '@/ted/entities/ted-cash-in.entity';
import { TedRefund } from '@/ted/entities/ted-refund.entity';

export type TransactionSource =
  | PixCashIn
  | PixTransfer
  | PixRefund
  | Boleto
  | BillPayment
  | PixQrCode
  | TedTransfer
  | TedCashIn
  | TedRefund;
