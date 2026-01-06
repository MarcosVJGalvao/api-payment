import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Nome da role',
    example: 'Manager',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Descrição da role',
    example: 'Role para gerentes',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'IDs das permissões a serem atribuídas à role',
    example: ['uuid1', 'uuid2'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  permissionIds?: string[];

  @ApiProperty({
    description:
      'Nomes das permissões a serem atribuídas à role (alternativa ao permissionIds)',
    example: ['user:read', 'user:write'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionNames?: string[];
}
