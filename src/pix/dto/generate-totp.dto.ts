import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TotpOperation } from '../enums/totp-operation.enum';
import { PixKeyType } from '../enums/pix-key-type.enum';

export class GenerateTotpDto {
  @ApiProperty({
    description:
      'Finalidade da geração do TOTP: RegisterEntry (cadastro), Portability (portabilidade), Ownership (reivindicação)',
    enum: TotpOperation,
    example: TotpOperation.REGISTER_ENTRY,
  })
  @IsEnum(TotpOperation)
  @IsNotEmpty()
  operation: TotpOperation;

  @ApiProperty({
    description: 'Tipo da chave PIX (apenas PHONE ou EMAIL)',
    enum: [PixKeyType.PHONE, PixKeyType.EMAIL],
    example: PixKeyType.EMAIL,
  })
  @IsEnum(PixKeyType)
  @IsNotEmpty()
  type: PixKeyType;

  @ApiProperty({
    description: 'Valor da chave (email ou telefone)',
    example: 'teste@teste.com',
  })
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.type === PixKeyType.EMAIL)
  @MaxLength(72, { message: 'Email must have at most 72 characters' })
  @Matches(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/, {
    message: 'Email must be lowercase and valid',
  })
  @ValidateIf((o) => o.type === PixKeyType.PHONE)
  @Matches(/^\+55\d{10,11}$/, {
    message: 'Phone must be in format +55XXXXXXXXXXX',
  })
  value: string;

  @ApiPropertyOptional({
    description:
      'ID de reivindicação da chave (obrigatório para Portability e Ownership)',
    example: 'a5104f29-33a8-47...',
  })
  @ValidateIf(
    (o) =>
      o.operation === TotpOperation.PORTABILITY ||
      o.operation === TotpOperation.OWNERSHIP,
  )
  @IsString()
  @IsNotEmpty({
    message: 'pixKeyClaimId is required for Portability/Ownership',
  })
  pixKeyClaimId?: string;
}
