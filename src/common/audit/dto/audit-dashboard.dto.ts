import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AuditDashboardQueryDto {
  @ApiPropertyOptional({
    description:
      'Data de início do filtro para estatísticas (formato ISO 8601)',
    example: '2025-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim do filtro para estatísticas (formato ISO 8601)',
    example: '2025-11-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    default: 10,
    description: 'Quantidade de logs recentes a retornar em recentActivity',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recentActivityLimit?: number = 10;
}
