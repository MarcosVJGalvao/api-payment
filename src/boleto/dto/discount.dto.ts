import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { DiscountType } from '../enums/discount-type.enum';
import { IDiscount } from '../interfaces/discount.interface';

export class DiscountDto implements IDiscount {
  @ApiProperty({
    description: 'Data limite para incidência de desconto (formato yyyy-MM-dd)',
    example: '2025-09-19',
  })
  @IsDateString()
  @IsNotEmpty()
  limitDate: string;

  @ApiProperty({ description: 'Valor do desconto', example: 1.58 })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({
    enum: DiscountType,
    description: 'Tipo de regra para cálculo do desconto',
  })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  type: DiscountType;
}
