import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditLogStatus } from '../enums/audit-log-status.enum';

/**
 * DTO de resposta resumida para listagem de logs de auditoria
 * Contém apenas os campos essenciais para exibição em tabela/listagem
 * Para ver todos os detalhes, utilize o endpoint GET /audit/:id
 */
export class AuditLogListItemDto {
  @ApiProperty({
    description: 'ID do log de auditoria',
    example: '9b520d8b-c836-42dd-90da-9a98e7f006fc',
  })
  id: string;

  @ApiProperty({
    description: 'Ação realizada',
    enum: AuditAction,
    example: AuditAction.USER_CREATED,
  })
  action: AuditAction;

  @ApiProperty({
    description: 'Tipo da entidade',
    example: 'User',
  })
  entityType: string;

  @ApiProperty({
    description: 'Nome de usuário que realizou a ação',
    example: 'admin',
    nullable: true,
  })
  username?: string;

  @ApiProperty({
    description: 'ID de correlação da requisição',
    example: '206285ed-eb73-48da-a58f-012960bbc3e4',
    nullable: true,
  })
  correlationId?: string;

  @ApiProperty({
    description: 'Status da operação',
    enum: AuditLogStatus,
    example: AuditLogStatus.SUCCESS,
  })
  status: AuditLogStatus;

  @ApiProperty({
    description: 'Descrição da ação',
    example: 'Created a user',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Data e hora da criação do log',
    example: '2025-11-08T01:37:33.000Z',
  })
  createdAt: Date;
}
