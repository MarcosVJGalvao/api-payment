import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { PixKeyType } from '../enums/pix-key-type.enum';

/**
 * DTO para geração de QR Code Estático
 */
export class GenerateStaticQrCodeDto {
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
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  addressingKeyValue: string;

  @ApiPropertyOptional({
    description: 'Valor do QR Code',
    example: 100.5,
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Nome do recebedor (campo obsoleto)',
    example: 'João da Silva',
  })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  recipientName?: string;

  @ApiPropertyOptional({
    description:
      'Identificador de conciliação. Apenas alfanuméricos (a-z, A-Z, 0-9). Máximo 25 caracteres.',
    example: 'A1B2C3D4E5F6G7H8I9J0K1L2M',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9]{0,25}$/, {
    message:
      'conciliationId deve conter apenas caracteres alfanuméricos e ter no máximo 25 caracteres',
  })
  conciliationId?: string;

  @ApiPropertyOptional({
    description: 'MCC (Merchant Category Code). Valor padrão: 0000',
    example: '0000',
  })
  @IsString()
  @IsOptional()
  @MaxLength(4)
  categoryCode?: string;

  @ApiProperty({
    description: 'Cidade do recebedor (máximo 15 caracteres)',
    example: 'São Paulo',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  locationCity: string;

  @ApiProperty({
    description: 'CEP do recebedor',
    example: '01001000',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  locationZipCode: string;
}
