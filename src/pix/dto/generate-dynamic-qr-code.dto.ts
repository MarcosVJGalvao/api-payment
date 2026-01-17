import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PixKeyType } from '../enums/pix-key-type.enum';

/**
 * DTO para endereço do pagador
 */
export class PayerAddressDto {
  @ApiPropertyOptional({
    description: 'Logradouro',
    example: 'Av. Central, nº 456',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine?: string;

  @ApiPropertyOptional({
    description: 'Sigla do estado (ISO 3166-2:BR)',
    example: 'SP',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  state?: string;

  @ApiProperty({
    description: 'Cidade do pagador',
    example: 'São Paulo',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  city: string;

  @ApiProperty({
    description: 'CEP do pagador',
    example: '01001-000',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  zipCode: string;
}

/**
 * DTO para informações do pagador
 */
export class PayerDto {
  @ApiProperty({
    description: 'Nome do pagador (máximo 25 caracteres)',
    example: 'João Souza',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  name: string;

  @ApiProperty({
    description: 'Documento do pagador (CPF ou CNPJ)',
    example: '01234567890',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentNumber: string;

  @ApiProperty({
    description: 'Tipo de pagador',
    enum: ['CUSTOMER', 'BUSINESS'],
    example: 'CUSTOMER',
  })
  @IsString()
  @IsNotEmpty()
  type: 'CUSTOMER' | 'BUSINESS';

  @ApiProperty({
    description: 'Endereço do pagador',
    type: PayerAddressDto,
  })
  @ValidateNested()
  @Type(() => PayerAddressDto)
  address: PayerAddressDto;
}

/**
 * DTO para geração de QR Code Dinâmico
 */
export class GenerateDynamicQrCodeDto {
  @ApiProperty({
    description: 'Tipo da chave PIX',
    enum: PixKeyType,
    example: PixKeyType.EVP,
  })
  @IsEnum(PixKeyType)
  @IsNotEmpty()
  addressingKeyType: PixKeyType;

  @ApiProperty({
    description: 'Valor da chave PIX',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  addressingKeyValue: string;

  @ApiPropertyOptional({
    description: 'Identificador de conciliação (alfanumérico 26-35 caracteres)',
    example: 'ZXC123VBN456QWE789TYU0PLKM',
  })
  @IsString()
  @IsOptional()
  @MinLength(26, { message: 'conciliationId deve ter no mínimo 26 caracteres' })
  @MaxLength(35, { message: 'conciliationId deve ter no máximo 35 caracteres' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'conciliationId deve conter apenas caracteres alfanuméricos',
  })
  conciliationId?: string;

  @ApiPropertyOptional({
    description:
      'Indica se é pagamento único. Se true, o QR Code expira após o pagamento.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  singlePayment?: boolean;

  @ApiPropertyOptional({
    description: 'Nome do recebedor (máximo 250 caracteres)',
    example: 'Fernanda Oliveira',
  })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  recipientName?: string;

  @ApiPropertyOptional({
    description: 'Data e hora de expiração (formato ISO 8601 UTC)',
    example: '2026-03-15 14:30:00',
  })
  @IsString()
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({
    description: 'Informações do pagador',
    type: PayerDto,
  })
  @ValidateNested()
  @Type(() => PayerDto)
  payer: PayerDto;

  @ApiPropertyOptional({
    description: 'Indica se o valor pode ser alterado (ALLOWED ou NOT_ALLOWED)',
    enum: ['ALLOWED', 'NOT_ALLOWED'],
    example: 'NOT_ALLOWED',
  })
  @IsString()
  @IsOptional()
  changeAmountType?: 'ALLOWED' | 'NOT_ALLOWED';

  @ApiPropertyOptional({
    description: 'Valor da transação',
    example: 700,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;
}
