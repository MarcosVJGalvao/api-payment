import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';
import { ClientStatus } from '../enums/client-status.enum';

export class QueryClientDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: ClientStatus, description: 'Filtrar por status' })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
