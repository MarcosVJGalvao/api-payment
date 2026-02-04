import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsDateString,
  Validate,
} from 'class-validator';
import { RequireBothDatesConstraint } from '../validators/require-both-dates.validator';
import { ValidateDateRangeConstraint } from '../validators/date-range.validator';
import { SortOrder } from '../enums/sort-order.enum';

export class BaseQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Página atual' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
    description: 'Limite de itens por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Busca por texto em múltiplos campos usando busca parcial (LIKE). Os campos pesquisados são configurados no serviço através do parâmetro searchFields.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Data inicial para filtragem',
  })
  @IsOptional()
  @IsDateString()
  @Validate(RequireBothDatesConstraint, {
    message: 'startDate and endDate must be provided together',
  })
  @Validate(ValidateDateRangeConstraint, {
    message: 'endDate must be greater than or equal to startDate',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final para filtragem',
  })
  @IsOptional()
  @IsDateString()
  @Validate(RequireBothDatesConstraint, {
    message: 'startDate and endDate must be provided together',
  })
  @Validate(ValidateDateRangeConstraint, {
    message: 'endDate must be greater than or equal to startDate',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Ordem de ordenação',
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
