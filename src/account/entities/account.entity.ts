import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Client } from '@/client/entities/client.entity';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum AccountType {
  MAIN = 'MAIN',
  SAVINGS = 'SAVINGS',
}

@Entity('account')
@Index(['externalId', 'clientId'], { unique: true })
@Index(['clientId'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'external_id',
    comment: 'ID externo da conta no provedor financeiro',
  })
  externalId: string;

  @Column({
    type: 'uuid',
    name: 'client_id',
    comment: 'ID do cliente',
  })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
    comment: 'Status da conta',
  })
  status: AccountStatus;

  @Column({
    type: 'varchar',
    length: 10,
    comment: 'Agência da conta',
  })
  branch: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'Número da conta',
  })
  number: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    comment: 'Tipo da conta',
  })
  type: AccountType;

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
