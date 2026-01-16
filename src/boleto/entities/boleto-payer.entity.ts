import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Boleto } from '@/boleto/entities/boleto.entity';

@Entity('boleto_payer')
export class BoletoPayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nome do pagador',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'trade_name',
    nullable: true,
    comment: 'Nome fantasia do pagador',
  })
  tradeName?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Documento do pagador (CPF/CNPJ)',
  })
  document: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Endereço completo do pagador',
  })
  address?: {
    zipCode: string;
    addressLine: string;
    neighborhood: string;
    city: string;
    state: string;
  };

  @OneToOne(() => Boleto, (boleto) => boleto.payer)
  boleto?: Boleto;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
