import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PixKeyType } from '../enums/pix-key-type.enum';

/**
 * DTO para cadastro de chave PIX
 *
 * Validações por tipo:
 * - CPF: 11 dígitos numéricos
 * - CNPJ: 14 dígitos numéricos
 * - EMAIL: lowercase, max 72 caracteres
 * - PHONE: formato +55XXXXXXXXXXX
 * - EVP: não requer value
 */
export class RegisterPixKeyDto {
  @ApiProperty({
    description: 'Tipo da chave PIX',
    enum: PixKeyType,
    example: PixKeyType.CPF,
  })
  @IsEnum(PixKeyType)
  @IsNotEmpty()
  type: PixKeyType;

  @ApiPropertyOptional({
    description:
      'Valor da chave PIX (obrigatório exceto para EVP). CPF: 11 dígitos, CNPJ: 14 dígitos, EMAIL: max 72 chars lowercase, PHONE: +55XXXXXXXXXXX',
    example: '47742663023',
  })
  @ValidateIf((o) => o.type !== PixKeyType.EVP)
  @IsString()
  @IsNotEmpty({ message: 'Value is required for this key type' })
  @ValidateIf((o) => o.type === PixKeyType.CPF)
  @Matches(/^\d{11}$/, { message: 'CPF must have exactly 11 digits' })
  @ValidateIf((o) => o.type === PixKeyType.CNPJ)
  @Matches(/^\d{14}$/, { message: 'CNPJ must have exactly 14 digits' })
  @ValidateIf((o) => o.type === PixKeyType.EMAIL)
  @MaxLength(72, { message: 'Email must have at most 72 characters' })
  @Matches(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/, {
    message: 'Email must be lowercase and valid',
  })
  @ValidateIf((o) => o.type === PixKeyType.PHONE)
  @Matches(/^\+55\d{10,11}$/, {
    message: 'Phone must be in format +55XXXXXXXXXXX',
  })
  value?: string;

  @ApiPropertyOptional({
    description:
      'Código TOTP de 6 dígitos (obrigatório para EMAIL e PHONE). Deve ser gerado previamente via endpoint /totp',
    example: '312210',
  })
  @ValidateIf((o) => o.type === PixKeyType.EMAIL || o.type === PixKeyType.PHONE)
  @IsString()
  @IsNotEmpty({ message: 'TOTP code is required for EMAIL and PHONE keys' })
  @Length(6, 6, { message: 'TOTP code must have exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'TOTP code must contain only numbers' })
  totpCode?: string;
}
