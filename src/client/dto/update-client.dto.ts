import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ClientStatus } from '../enums/client-status.enum';
import { IUpdateClient } from '../interfaces/update-client.interface';

export class UpdateClientDto implements IUpdateClient {
  @ApiPropertyOptional({ description: 'Nome do cliente', example: 'Empresa XYZ Ltda' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ClientStatus, description: 'Status do cliente' })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiPropertyOptional({ 
    description: 'Scopes (permissões) a serem vinculados ao cliente. Substitui todos os scopes atuais.', 
    example: ['financial:boleto', 'auth:bank'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
