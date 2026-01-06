import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdatePermissionDto {
  @ApiProperty({
    description: 'Nome da permissão (ex: user:read)',
    example: 'user:read',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z_]+:[a-z*]+$/, {
    message: 'Permission name must be in format "module:action"',
  })
  name?: string;

  @ApiProperty({
    description: 'Módulo da permissão',
    example: 'user',
    required: false,
  })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiProperty({
    description: 'Ação da permissão',
    example: 'read',
    required: false,
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({
    description: 'Descrição da permissão',
    example: 'Permite ler usuários',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
