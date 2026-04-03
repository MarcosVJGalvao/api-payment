import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator';

/**
 * DTO para decodificação de QR Code via API do provedor
 */
export class DecodeQrCodeDto {
  @ApiProperty({
    description: 'Conteúdo do QR Code em Base64',
    example:
      'MDAwMjAxMjYzMzAwMRici5nb3YuYmNiLnBpeDAxMTEwNTY3ODQwNDg0OTUyMDQwMDAwNTMwMzk4NjU0MDUxMC4wMTU4MDJCUjU5MTVGZXJuYW5kbyBTZWd1aW02MDA5U2FvIFBhdWxvNjEwODA0MjA1MDAwNjIwNzA1MDMqKio2MzA0Njc5Ng==',
  })
  @IsString()
  @IsNotEmpty({ message: 'code é obrigatório' })
  code: string;

  @ApiProperty({
    description: 'Codigo da cidade conforme IBGE',
    example: '3550308',
  })
  @Length(7, 7, { message: 'cityCode deve conter exatamente 7 caracteres' })
  @IsNumberString()
  @IsNotEmpty({ message: 'cityCode é obrigatório' })
  cityCode: string;
}
