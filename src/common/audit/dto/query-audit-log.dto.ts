import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditLogStatus } from '../enums/audit-log-status.enum';
import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';

export class QueryAuditLogDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: AuditAction,
    description: 'Filtrar por ação específica',
    example: AuditAction.USER_CREATED,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    enum: AuditLogStatus,
    description: 'Filtrar por status da operação',
    example: AuditLogStatus.SUCCESS,
  })
  @IsOptional()
  @IsEnum(AuditLogStatus)
  status?: AuditLogStatus;
}
