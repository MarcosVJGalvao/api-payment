import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsPixKey } from '../validators/is-pix-key.validator';

export class ValidatePixKeyParamsDto {
  @ApiProperty({
    description: `Valor da chave PIX a ser validada:
- CPF: 11 dígitos sem máscara (ex: 12345678901)
- CNPJ: 14 dígitos sem máscara (ex: 12345678000199)
- Email: formato padrão (ex: email@exemplo.com)
- Telefone: +55 + DDD + número (ex: +5511999999999)
- EVP: UUID com ou sem hífens (ex: 123e4567-e89b-12d3-a456-426614174000)`,
    examples: ['12345678901', '+5511999999999', 'email@exemplo.com'],
  })
  @IsString()
  @IsNotEmpty()
  @IsPixKey()
  addressingKey: string;
}
