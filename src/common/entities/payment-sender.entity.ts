import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixRefund } from '@/pix/entities/pix-refund.entity';
import { PixQrCode } from '@/pix/entities/pix-qr-code.entity';

@Entity('payment_sender')
export class PaymentSender {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nome do remetente',
  })
  name?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'trade_name',
    nullable: true,
    comment: 'Nome fantasia do remetente',
  })
  tradeName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Tipo de remetente (Customer, Business)',
  })
  type?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'document_type',
    nullable: true,
    comment: 'Tipo de documento (CPF/CNPJ)',
  })
  documentType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'document_number',
    nullable: true,
    comment: 'Número do documento',
  })
  documentNumber: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'bank_name',
    nullable: true,
    comment: 'Nome do banco',
  })
  bankName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'bank_ispb',
    nullable: true,
    comment: 'ISPB do banco',
  })
  bankIspb?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'bank_compe',
    nullable: true,
    comment: 'Código COMPE do banco',
  })
  bankCompe?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'account_branch',
    nullable: true,
    comment: 'Agência da conta',
  })
  accountBranch?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'account_number',
    nullable: true,
    comment: 'Número da conta',
  })
  accountNumber?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'account_type',
    nullable: true,
    comment: 'Tipo da conta (corrente/poupança)',
  })
  accountType?: string;

  @OneToOne(() => PixTransfer, (pixTransfer) => pixTransfer.sender)
  pixTransfer?: PixTransfer;

  @OneToOne(() => PixCashIn, (pixCashIn) => pixCashIn.sender)
  pixCashIn?: PixCashIn;

  @OneToOne(() => PixRefund, (pixRefund) => pixRefund.sender)
  pixRefund?: PixRefund;

  @OneToOne(() => PixQrCode, (pixQrCode) => pixQrCode.payer)
  pixQrCode?: PixQrCode;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
