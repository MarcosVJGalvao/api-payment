import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PixInitializationType } from '../enums/pix-initialization-type.enum';

class RecipientAccountDto {
  @ApiProperty({ example: '0001' })
  @IsString()
  @IsNotEmpty()
  branch: string;

  @ApiProperty({ example: '1101263307' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 'CHECKING' })
  @IsString()
  @IsNotEmpty()
  type: string;
}

class RecipientBankDto {
  @ApiProperty({ example: '13140088' })
  @IsString()
  @IsNotEmpty()
  ispb: string;
}

class RecipientDto {
  @ApiProperty({ example: '52145638795' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ example: 'Alberto Gilberto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: RecipientAccountDto })
  @ValidateNested()
  @Type(() => RecipientAccountDto)
  account: RecipientAccountDto;

  @ApiProperty({ type: RecipientBankDto })
  @ValidateNested()
  @Type(() => RecipientBankDto)
  bank: RecipientBankDto;
}

export class PixTransferDto {
  @ApiProperty({
    description: 'Valor da transferência',
    example: 10.5,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Tipo de inicialização',
    enum: PixInitializationType,
    example: PixInitializationType.KEY,
  })
  @IsEnum(PixInitializationType)
  @IsNotEmpty()
  initializationType: PixInitializationType;

  @ApiPropertyOptional({
    description: 'Descrição da transferência (max 140 chars)',
    example: 'Pagamento Pix',
  })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @ApiPropertyOptional({
    description: 'Data de pagamento (ISO format, vazio para imediato)',
    example: '',
  })
  @IsOptional()
  @IsString()
  paymentDate?: string;

  @ApiPropertyOptional({
    description: 'Chave de idempotência (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  // ============ Campos para Key e QrCode ============
  @ApiPropertyOptional({
    description:
      'endToEndId retornado na validação (obrigatório para Key/QrCode)',
    example: 'E13140088202507090058341B5EC16CC',
  })
  @ValidateIf((o) => o.initializationType !== PixInitializationType.MANUAL)
  @IsString()
  @IsNotEmpty({ message: 'endToEndId is required for Key/QrCode transfers' })
  endToEndId?: string;

  @ApiPropertyOptional({
    description: 'Chave PIX do recebedor (obrigatório para Key/QrCode)',
    example: '47742663023',
  })
  @ValidateIf((o) => o.initializationType !== PixInitializationType.MANUAL)
  @IsString()
  @IsNotEmpty({ message: 'pixKey is required for Key/QrCode transfers' })
  pixKey?: string;

  // ============ Campos específicos QrCode ============
  @ApiPropertyOptional({
    description: 'conciliationId para StaticQrCode',
    example: 'FiCapc7D0Ul7KHDOnZp8HGaCS',
  })
  @ValidateIf(
    (o) => o.initializationType === PixInitializationType.STATIC_QR_CODE,
  )
  @IsString()
  @IsNotEmpty({ message: 'conciliationId is required for StaticQrCode' })
  conciliationId?: string;

  @ApiPropertyOptional({
    description: 'receiverReconciliationId para DynamicQrCode',
    example: 'Jk6GDZxqDD0HizWOfIYxGosIn9',
  })
  @ValidateIf(
    (o) => o.initializationType === PixInitializationType.DYNAMIC_QR_CODE,
  )
  @IsString()
  @IsNotEmpty({
    message: 'receiverReconciliationId is required for DynamicQrCode',
  })
  receiverReconciliationId?: string;

  // ============ Campos para Manual ============
  @ApiPropertyOptional({
    description: 'Dados do recebedor (obrigatório para Manual)',
    type: RecipientDto,
  })
  @ValidateIf((o) => o.initializationType === PixInitializationType.MANUAL)
  @ValidateNested()
  @Type(() => RecipientDto)
  recipient?: RecipientDto;
}
