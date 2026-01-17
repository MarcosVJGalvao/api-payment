import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TedSenderDto {
  @ApiProperty({ example: '12345678901', description: 'CPF/CNPJ do remetente' })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({ example: 'João da Silva', description: 'Nome do remetente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '0001', description: 'Agência da conta' })
  @IsString()
  @IsNotEmpty()
  branch: string;

  @ApiProperty({ example: '123456', description: 'Número da conta' })
  @IsString()
  @IsNotEmpty()
  account: string;
}
