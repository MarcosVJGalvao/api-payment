import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Client } from '@/client/entities/client.entity';
import { Account } from '@/account/entities/account.entity';
import { OnboardingTypeAccount } from '../enums/onboarding-type-account.enum';

@Entity('onboarding')
@Index(['externalUserId', 'clientId'], { unique: true })
@Index(['clientId'])
export class Onboarding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
    type: 'varchar',
    length: 255,
    name: 'external_user_id',
    comment: 'ID externo do usuário no provedor financeiro',
  })
  externalUserId: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'register_name',
    comment: 'Nome de registro',
  })
  registerName: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'document_number',
    comment: 'Número do documento',
  })
  documentNumber: string;

  @Column({
    type: 'enum',
    enum: OnboardingTypeAccount,
    name: 'type_account',
    comment: 'Tipo de conta (PF ou PJ)',
  })
  typeAccount: OnboardingTypeAccount;

  @OneToMany(() => Account, (account) => account.onboarding)
  accounts: Account[];

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
