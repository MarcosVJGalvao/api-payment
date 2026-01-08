import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { FineType } from '../enums/fine-type.enum';
import { IFine } from '../interfaces/fine.interface';

export class FineDto implements IFine {
    @ApiProperty({ description: 'Data de início para cálculo da multa (formato yyyy-MM-dd)', example: '2025-09-21' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ description: 'Valor da multa', example: 64.25 })
    @IsNumber()
    @IsNotEmpty()
    value: number;

    @ApiProperty({ enum: FineType, description: 'Tipo de regra aplicada à multa' })
    @IsEnum(FineType)
    @IsNotEmpty()
    type: FineType;
}
