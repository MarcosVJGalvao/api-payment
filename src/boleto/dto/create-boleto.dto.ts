import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsEnum,
    IsDateString,
    ValidateNested,
    Min,
    Matches,
} from 'class-validator';
import { BoletoType } from '../enums/boleto-type.enum';
import { ICreateBoleto } from '../interfaces/create-boleto.interface';
import { AccountDto } from './account.dto';
import { PayerDto } from './payer.dto';
import { InterestDto } from './interest.dto';
import { FineDto } from './fine.dto';
import { DiscountDto } from './discount.dto';

export class CreateBoletoDto implements ICreateBoleto {
    @ApiPropertyOptional({ description: 'Nome para identificar o boleto externamente', example: 'Teste emissão de boleto' })
    @IsOptional()
    @IsString()
    alias?: string;

    @ApiProperty({ type: AccountDto, description: 'Informações da conta do beneficiário' })
    @ValidateNested()
    @Type(() => AccountDto)
    account: AccountDto;

    @ApiProperty({ description: 'Número do documento (CPF ou CNPJ) do beneficiário final', example: '50300633859100' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d+$/, { message: 'Documento deve conter apenas números' })
    documentNumber: string;

    @ApiProperty({ description: 'Valor do boleto', example: 442.96 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0.01)
    amount: number;

    @ApiProperty({ description: 'Data de vencimento do boleto (formato yyyy-MM-dd)', example: '2025-09-20' })
    @IsDateString()
    @IsNotEmpty()
    dueDate: string;

    @ApiPropertyOptional({ description: 'Data limite para pagamento após vencimento (formato yyyy-MM-dd)', example: '2025-11-20' })
    @IsOptional()
    @IsDateString()
    closePayment?: string;

    @ApiProperty({ enum: BoletoType, description: 'Tipo de boleto' })
    @IsEnum(BoletoType)
    @IsNotEmpty()
    type: BoletoType;

    @ApiPropertyOptional({ type: PayerDto, description: 'Informações do pagador (obrigatório para tipo Levy)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => PayerDto)
    payer?: PayerDto;

    @ApiPropertyOptional({ type: InterestDto, description: 'Informações sobre juros (apenas para tipo Levy)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => InterestDto)
    interest?: InterestDto;

    @ApiPropertyOptional({ type: FineDto, description: 'Informações sobre multa (apenas para tipo Levy)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => FineDto)
    fine?: FineDto;

    @ApiPropertyOptional({ type: DiscountDto, description: 'Informações sobre desconto (apenas para tipo Levy)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => DiscountDto)
    discount?: DiscountDto;
}
