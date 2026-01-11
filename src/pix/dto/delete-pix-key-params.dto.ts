import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para parâmetros de exclusão de chave PIX
 */
export class DeletePixKeyParamsDto {
  @ApiProperty({
    description: 'Valor da chave PIX a ser excluída',
    example: '47742663023',
  })
  @IsString()
  @IsNotEmpty()
  addressKey: string;

  @ApiProperty({
    description: 'Provedor financeiro',
    example: 'hiperbanco',
  })
  @IsString()
  @IsNotEmpty()
  provider: string;
}
