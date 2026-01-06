import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '../enums/audit-action.enum';

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
}

export class AuditExportDto {
  @ApiPropertyOptional({
    description: 'Data de início do filtro (formato ISO 8601)',
    example: '2025-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim do filtro (formato ISO 8601)',
    example: '2025-11-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: AuditAction,
    description: 'Filtrar por ação específica',
    example: AuditAction.USER_CREATED,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de entidade',
    example: 'User',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da entidade',
    example: '21185e1e-2401-4a54-96cb-256ba1f40faf',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do usuário',
    example: '0886d835-bb67-4085-9e33-69e36c040933',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    enum: ExportFormat,
    default: ExportFormat.JSON,
    description: 'Formato de exportação (json ou csv)',
    example: ExportFormat.JSON,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.JSON;
}
