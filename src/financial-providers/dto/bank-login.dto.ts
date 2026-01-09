import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para login bancário (operações do usuário final).
 */
export class BankLoginDto {
  @ApiProperty({
    example: '52365478526',
    description: 'CPF ou CNPJ do usuário (apenas números)',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    example: 'Senhatest123@',
    description: 'Senha do usuário',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
