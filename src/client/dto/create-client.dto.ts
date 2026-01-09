import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches, IsArray } from 'class-validator';
import { ICreateClient } from '../interfaces/create-client.interface';

export class CreateClientDto implements ICreateClient {
  @ApiProperty({ description: 'Nome do cliente', example: 'Empresa XYZ Ltda' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'CPF ou CNPJ do cliente (apenas números)', example: '12345678901234' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Documento deve conter apenas números' })
  document: string;

  @ApiPropertyOptional({ 
    description: 'Scopes (permissões) a serem vinculados ao cliente', 
    example: ['financial:boleto', 'auth:bank'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
