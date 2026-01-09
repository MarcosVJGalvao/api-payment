import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '@/client/entities/client.entity';
import { Permission } from './permission.entity';

@Entity('client_permission')
@Index(['clientId', 'permissionId'], { unique: true })
@Index(['clientId'])
@Index(['permissionId'])
export class ClientPermission {
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
    type: 'uuid',
    name: 'permission_id',
    comment: 'ID da permissão (scope)',
  })
  permissionId: string;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

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
