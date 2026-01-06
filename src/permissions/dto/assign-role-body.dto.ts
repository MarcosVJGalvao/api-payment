import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignRoleBodyDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '0886d835-bb67-4085-9e33-69e36c040933',
  })
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;
}
