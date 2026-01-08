import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { Client } from '@/client/entities/client.entity';

@Entity('permission')
@Unique(['name', 'clientId'])
@Index(['module', 'action'])
@Index(['clientId'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome da permissão (ex: user:read)',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Módulo da permissão (ex: user, employee)',
  })
  module: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Ação da permissão (ex: read, write, create)',
  })
  action: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição da permissão',
  })
  description: string;

  @Column({
    type: 'uuid',
    name: 'client_id',
    nullable: true,
    comment: 'ID do cliente (null para permissões globais)',
  })
  clientId: string | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client | null;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
    {
      cascade: true,
    },
  )
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
