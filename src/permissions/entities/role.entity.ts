import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { Client } from '@/client/entities/client.entity';

@Entity('role')
@Unique(['name', 'clientId'])
@Index(['clientId'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome da role',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição da role',
  })
  description: string;

  @Column({
    type: 'uuid',
    name: 'client_id',
    nullable: true,
    comment: 'ID do cliente (null para roles globais)',
  })
  clientId: string | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client | null;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role, {
    cascade: true,
  })
  rolePermissions: RolePermission[];

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
  deletedAt: Date;
}
