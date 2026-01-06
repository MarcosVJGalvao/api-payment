import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryRoleDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por nome da role',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
