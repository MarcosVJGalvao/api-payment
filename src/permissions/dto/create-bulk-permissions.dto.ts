import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';

export class CreateBulkPermissionsDto {
  @ApiProperty({
    description: 'Módulo da permissão',
    example: 'user',
  })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({
    description: 'Lista de ações para criar permissões',
    example: ['read', 'write', 'delete', 'create'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  actions: string[];

  @ApiProperty({
    description: 'Descrição padrão para as permissões (opcional)',
    example: 'Permite gerenciar usuários',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
