import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsString, IsOptional } from 'class-validator';

export class UpdateRolePermissionsDto {
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
