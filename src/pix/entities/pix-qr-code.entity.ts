import {
  Entity,
  Column,
  Index,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseFinancialOperation } from '@/common/entities/base-financial-operation.entity';
import { PixQrCodeType } from '../enums/pix-qr-code-type.enum';
import { PixQrCodeStatus } from '../enums/pix-qr-code-status.enum';
import { PixKeyType } from '../enums/pix-key-type.enum';
import { Transaction } from '@/transaction/entities/transaction.entity';
import { PaymentSender } from '@/common/entities/payment-sender.entity';

@Entity('pix_qr_codes')
@Index(['conciliationId'])
@Index(['status'])
@Index(['type'])
@Index(['providerSlug'])
export class PixQrCode extends BaseFinancialOperation {
  @Column({
    type: 'text',
    name: 'encoded_value',
    comment: 'Valor codificado do QR Code (base64)',
  })
  encodedValue: string;

  @Column({
    type: 'enum',
    enum: PixQrCodeType,
    comment: 'Tipo do QR Code (STATIC ou DYNAMIC)',
  })
  type: PixQrCodeType;

  @Column({
    type: 'enum',
    enum: PixQrCodeStatus,
    default: PixQrCodeStatus.CREATED,
    comment: 'Status do QR Code',
  })
  status: PixQrCodeStatus;

  @Column({
    type: 'varchar',
    length: 35,
    name: 'conciliation_id',
    nullable: true,
    comment: 'Identificador de conciliação (alfanumérico)',
  })
  conciliationId?: string;

  @Column({
    type: 'enum',
    enum: PixKeyType,
    name: 'addressing_key_type',
    comment: 'Tipo da chave PIX',
  })
  addressingKeyType: PixKeyType;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'addressing_key_value',
    comment: 'Valor da chave PIX',
  })
  addressingKeyValue: string;

  @Column({
    type: 'varchar',
    length: 250,
    name: 'recipient_name',
    nullable: true,
    comment: 'Nome do recebedor da transação',
  })
  recipientName?: string;

  @Column({
    type: 'varchar',
    length: 4,
    name: 'category_code',
    nullable: true,
    default: '0000',
    comment: 'MCC (Merchant Category Code)',
  })
  categoryCode?: string;

  @Column({
    type: 'varchar',
    length: 15,
    name: 'location_city',
    nullable: true,
    comment: 'Cidade do recebedor',
  })
  locationCity?: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'location_zip_code',
    nullable: true,
    comment: 'CEP do recebedor',
  })
  locationZipCode?: string;

  @Column({
    type: 'boolean',
    name: 'single_payment',
    default: false,
    comment: 'Indica se é QR Code de pagamento único (apenas DYNAMIC)',
  })
  singlePayment: boolean;

  @Column({
    type: 'datetime',
    name: 'expires_at',
    nullable: true,
    comment: 'Data e hora de expiração do QR Code (apenas DYNAMIC)',
  })
  expiresAt?: Date;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'change_amount_type',
    nullable: true,
    comment: 'Indica se o valor pode ser alterado (ALLOWED/NOT_ALLOWED)',
  })
  changeAmountType?: string;

  // Pagador (apenas DYNAMIC) - usa tabela PaymentSender
  @OneToOne(() => PaymentSender, { cascade: true, eager: true, nullable: true })
  @JoinColumn({ name: 'payer_id' })
  payer?: PaymentSender;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'transaction_id',
    nullable: true,
    comment: 'ID da transação quando pago',
  })
  transactionId?: string;

  @OneToMany(() => Transaction, (transaction) => transaction.pixQrCode)
  transactions: Transaction[];
}
