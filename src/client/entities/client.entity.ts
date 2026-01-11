import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientStatus } from '../enums/client-status.enum';

@Entity('client')
@Index(['document'], { unique: true })
@Index(['status'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome do cliente',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'CPF ou CNPJ do cliente',
  })
  document: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
    comment: 'Alias do cliente para identificação em webhooks',
  })
  alias: string | null;

  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.ACTIVE,
    comment: 'Status do cliente',
  })
  status: ClientStatus;

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
