import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('internal_user')
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
export class InternalUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Nome de usuário único',
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Email do usuário',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Senha hasheada',
  })
  @Exclude()
  password: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome completo do usuário',
  })
  name: string;

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
