import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditLogStatus } from '../enums/audit-log-status.enum';

@Entity('audit_log')
@Index(['entityType', 'entityId'])
@Index(['userId'])
@Index(['action'])
@Index(['createdAt'])
@Index(['correlationId'])
@Index(['status'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
    comment: 'Ação realizada',
  })
  action: AuditAction;

  @Column({
    name: 'entity_type',
    type: 'varchar',
    length: 100,
    comment: 'Tipo da entidade (ex: User, Employee)',
  })
  entityType: string;

  @Column({
    name: 'entity_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: 'ID da entidade afetada',
  })
  entityId?: string;

  @Column({
    name: 'user_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: 'ID do usuário que realizou a ação',
  })
  userId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nome de usuário que realizou a ação',
  })
  username?: string;

  @Column({
    name: 'correlation_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: 'ID de correlação da requisição',
  })
  correlationId?: string;

  @Column({
    name: 'old_values',
    type: 'json',
    nullable: true,
    comment: 'Valores anteriores da entidade',
  })
  oldValues?: Record<string, unknown>;

  @Column({
    name: 'new_values',
    type: 'json',
    nullable: true,
    comment: 'Valores novos da entidade',
  })
  newValues?: Record<string, unknown>;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'Endereço IP do cliente',
  })
  ipAddress?: string;

  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
    comment: 'User agent do cliente',
  })
  userAgent?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição adicional da ação',
  })
  description?: string;

  @Column({
    type: 'enum',
    enum: AuditLogStatus,
    default: AuditLogStatus.SUCCESS,
    comment: 'Status da operação',
  })
  status: AuditLogStatus;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
    comment: 'Mensagem de erro, se a operação falhou',
  })
  errorMessage?: string;

  @Column({
    name: 'error_code',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Código do erro, se a operação falhou',
  })
  errorCode?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    comment: 'Data e hora da criação do log',
  })
  createdAt: Date;
}
