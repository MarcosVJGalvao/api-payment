import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FilterOperator } from '../enums/filter-operator.enum';
import type { FilterValue } from '../types/filter-value.type';
import { BaseQueryDto } from './base-query.dto';

export class FilterConditionDto {
  @ApiPropertyOptional()
  @IsString()
  field: string;

  @ApiPropertyOptional({ enum: FilterOperator })
  @IsEnum(FilterOperator)
  operator: FilterOperator;

  @ApiPropertyOptional({
    description:
      'Filter value. Can be string, number, boolean, Date, or array of these types',
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'string' } },
      { type: 'array', items: { type: 'number' } },
    ],
  })
  value: FilterValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relation?: string;
}

export class FilterQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ type: [FilterConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  filters?: FilterConditionDto[];
}
