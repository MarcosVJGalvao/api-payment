import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Nome da permissão (ex: user:read)',
    example: 'user:read',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z_]+:[a-z*]+$/, {
    message: 'Permission name must be in format "module:action"',
  })
  name: string;

  @ApiProperty({
    description: 'Módulo da permissão',
    example: 'user',
  })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({
    description: 'Ação da permissão',
    example: 'read',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    description: 'Descrição da permissão',
    example: 'Permite ler usuários',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
