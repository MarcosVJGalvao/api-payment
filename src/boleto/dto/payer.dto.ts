import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  Length,
  ValidateNested,
} from 'class-validator';
import { IPayer } from '../interfaces/payer.interface';
import { PayerAddressDto } from './payer-address.dto';

export class PayerDto implements IPayer {
  @ApiProperty({
    description:
      'Número do documento do pagador (CPF ou CNPJ - apenas números)',
    example: '90842497552',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Documento deve conter apenas números' })
  document: string;

  @ApiProperty({
    description: 'Nome completo do pagador',
    example: 'Larissa Nascimento',
    maxLength: 60,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 60)
  name: string;

  @ApiPropertyOptional({
    description: 'Nome fantasia ou comercial do pagador',
    example: 'Larissa Nascimento',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  tradeName?: string;

  @ApiProperty({ type: PayerAddressDto, description: 'Endereço do pagador' })
  @ValidateNested()
  @Type(() => PayerAddressDto)
  address: PayerAddressDto;
}
