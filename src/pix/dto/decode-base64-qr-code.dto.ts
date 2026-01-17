import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para decodificação de Base64 para EMV (Pix Copia e Cola)
 */
export class DecodeBase64QrCodeDto {
  @ApiProperty({
    description: 'Conteúdo do QR Code codificado em Base64',
    example:
      'MDAwMjAxMjYzMzAwMRici5nb3YuYmNiLnBpeDAxMTEwNTY3ODQwNDg0OTUyMDQwMDAwNTMwMzk4NjU0MDUxMC4wMTU4MDJCUjU5MTVGZXJuYW5kbyBTZWd1aW02MDA5U2FvIFBhdWxvNjEwODA0MjA1MDAwNjIwNzA1MDMqKio2MzA0Njc5Ng==',
  })
  @IsString()
  @IsNotEmpty({ message: 'encodedValue é obrigatório' })
  encodedValue: string;
}
