import { BaseQueryDto } from '@/common/base-query/dto/base-query.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { StatusEnum } from '@/common/enums/status.enum';

export class QueryBackofficeUserDto extends OmitType(BaseQueryDto, [
  'startDate',
  'endDate',
]) {
  @ApiPropertyOptional({
    description: 'Filtrar por status do usuário',
    enum: StatusEnum,
  })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

  @ApiPropertyOptional({
    description: 'Busca pelos campos name e email',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
