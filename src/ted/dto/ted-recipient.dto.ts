import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class TedRecipientDto {
  @ApiProperty({
    example: '98765432100',
    description: 'CPF/CNPJ do destinatário',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    example: 'Maria Oliveira',
    description: 'Nome do destinatário',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '341', description: 'Código COMPE do banco' })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ example: '0001', description: 'Agência da conta' })
  @IsString()
  @IsNotEmpty()
  branch: string;

  @ApiProperty({ example: '654321', description: 'Número da conta' })
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiPropertyOptional({
    example: 'CHECKING',
    description: 'Tipo de conta (CHECKING, SAVINGS)',
  })
  @IsOptional()
  @IsString()
  accountType?: string;
}
