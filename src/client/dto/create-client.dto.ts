import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, Matches } from 'class-validator';
import { ClientStatus } from '../enums/client-status.enum';
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

  @ApiPropertyOptional({ enum: ClientStatus, description: 'Status do cliente', default: ClientStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}
