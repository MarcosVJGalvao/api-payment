import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { Client } from '@/client/entities/client.entity';
import { Account } from '@/account/entities/account.entity';
import { Exclude } from 'class-transformer';

export abstract class BaseFinancialOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'Valor da operação',
  })
  amount: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'BRL',
    comment: 'Código da moeda (ISO 4217)',
  })
  currency: string;

  @Column({
    type: 'varchar',
    length: 140,
    nullable: true,
    comment: 'Descrição da operação',
  })
  description?: string;

  @Column({
    type: 'enum',
    enum: FinancialProvider,
    name: 'provider_slug',
    comment: 'Identificador do provedor financeiro',
  })
  providerSlug: FinancialProvider;

  @Column({
    type: 'uuid',
    name: 'client_id',
    comment: 'ID do cliente',
  })
  @Exclude()
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({
    type: 'uuid',
    name: 'account_id',
    comment: 'ID da conta associada',
  })
  accountId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
  })
  deletedAt?: Date;
}
