import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { InterestType } from '../enums/interest-type.enum';
import { IInterest } from '../interfaces/interest.interface';

export class InterestDto implements IInterest {
    @ApiProperty({ description: 'Data de início para cálculo dos juros (formato yyyy-MM-dd)', example: '2025-09-21' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ description: 'Valor dos juros', example: 73.46 })
    @IsNumber()
    @IsNotEmpty()
    value: number;

    @ApiProperty({ enum: InterestType, description: 'Tipo de regra para cálculo dos juros' })
    @IsEnum(InterestType)
    @IsNotEmpty()
    type: InterestType;
}
