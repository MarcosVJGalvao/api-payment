import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryPermissionDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por módulo',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ação',
    example: 'read',
  })
  @IsOptional()
  @IsString()
  action?: string;
}
