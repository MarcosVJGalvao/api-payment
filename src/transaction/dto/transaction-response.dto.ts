import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionSemanticStatus } from '../enums/transaction-semantic-status.enum';
import { getSemanticStatus } from '../helpers/transaction-status.helper';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixRefund } from '@/pix/entities/pix-refund.entity';
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { PixQrCode } from '@/pix/entities/pix-qr-code.entity';
import { TedTransfer } from '@/ted/entities/ted-transfer.entity';
import { TedCashIn } from '@/ted/entities/ted-cash-in.entity';
import { TedRefund } from '@/ted/entities/ted-refund.entity';

type TransactionSource =
  | PixCashIn
  | PixTransfer
  | PixRefund
  | Boleto
  | BillPayment
  | PixQrCode
  | TedTransfer
  | TedCashIn
  | TedRefund;

export class TransactionResponseDto {
  @ApiProperty({ description: 'ID da transação' })
  id: string;

  @ApiProperty({ description: 'Código de autenticação da transação' })
  authenticationCode: string;

  @ApiProperty({ enum: TransactionType, description: 'Tipo da transação' })
  type: TransactionType;

  @ApiProperty({
    enum: TransactionSemanticStatus,
    description: 'Status semântico/simplificado da transação',
  })
  status: TransactionSemanticStatus;

  @ApiProperty({
    enum: TransactionStatus,
    description: 'Status detalhado/original da transação',
  })
  detailedStatus: TransactionStatus;

  @ApiProperty({ description: 'Valor da transação', example: 100.5 })
  amount: number;

  @ApiProperty({ description: 'Moeda da transação', example: 'BRL' })
  currency: string;

  @ApiProperty({
    description: 'Descrição da transação',
    required: false,
    nullable: true,
  })
  description?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Timestamp do provedor',
    required: false,
    nullable: true,
  })
  providerTimestamp?: Date;

  @ApiProperty({
    description: 'Detalhes específicos da operação (Pix, Boleto, etc)',
    required: false,
    nullable: true,
  })
  details?: Partial<TransactionSource>;

  constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.authenticationCode = transaction.authenticationCode;
    this.type = transaction.type;
    this.detailedStatus = transaction.status;
    this.status = getSemanticStatus(transaction.status);
    this.amount = Number(transaction.amount); // Ensure it's a number
    this.currency = transaction.currency;
    this.description = transaction.description;
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
    this.providerTimestamp = transaction.providerTimestamp;

    // Detectar a relação ativa e remover campos duplicados
    const sourceRelation =
      transaction.pixCashIn ||
      transaction.pixTransfer ||
      transaction.pixRefund ||
      transaction.boleto ||
      transaction.billPayment ||
      transaction.pixQrCode ||
      transaction.tedTransfer ||
      transaction.tedCashIn ||
      transaction.tedRefund;

    if (sourceRelation) {
      this.details = this.removeRedundantFields(sourceRelation);
    }
  }

  private removeRedundantFields(
    source: TransactionSource,
  ): Partial<TransactionSource> {
    if (!this.description && source.description) {
      this.description = source.description;
    }

    const clean = { ...source } as Partial<TransactionSource> & {
      authenticationCode?: string;
      providerTimestamp?: Date;
    };

    // Remover campos redundantes
    delete clean.amount;
    delete clean.currency;
    delete clean.description;
    delete clean.authenticationCode;
    delete clean.providerTimestamp;
    delete clean.createdAt;
    delete clean.updatedAt;
    delete clean.deletedAt;
    delete clean.providerSlug;

    return clean;
  }
}
