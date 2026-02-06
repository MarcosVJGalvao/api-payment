import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { Transaction } from '../entities/transaction.entity';
import { hydrateTransactionRelations } from '../helpers/transaction-hydration.helper';
import { IHydrationRepositories } from '../interfaces/hydration-repositories.interface';

@Injectable()
export class TransactionHydratorService {
  private readonly repositories: IHydrationRepositories;

  constructor(
    @InjectRepository(PixCashIn)
    pixCashIn: Repository<PixCashIn>,
    @InjectRepository(PixTransfer)
    pixTransfer: Repository<PixTransfer>,
    @InjectRepository(PixRefund)
    pixRefund: Repository<PixRefund>,
    @InjectRepository(PixQrCode)
    pixQrCode: Repository<PixQrCode>,
    @InjectRepository(Boleto)
    boleto: Repository<Boleto>,
    @InjectRepository(BillPayment)
    billPayment: Repository<BillPayment>,
    @InjectRepository(TedTransfer)
    tedTransfer: Repository<TedTransfer>,
    @InjectRepository(TedCashIn)
    tedCashIn: Repository<TedCashIn>,
    @InjectRepository(TedRefund)
    tedRefund: Repository<TedRefund>,
  ) {
    this.repositories = {
      pixCashIn,
      pixTransfer,
      pixRefund,
      pixQrCode,
      boleto,
      billPayment,
      tedTransfer,
      tedCashIn,
      tedRefund,
    };
  }

  hydrate(transactions: Transaction[]): Promise<Transaction[]> {
    return hydrateTransactionRelations(transactions, this.repositories);
  }
}
