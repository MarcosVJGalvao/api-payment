import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '0886d835-bb67-4085-9e33-69e36c040933',
  })
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'ID da role',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4)
  @IsNotEmpty()
  roleId: string;
}
