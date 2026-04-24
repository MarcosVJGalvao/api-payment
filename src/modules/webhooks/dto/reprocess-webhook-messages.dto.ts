import { IsArray, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReprocessWebhookMessagesDto {
  @ApiPropertyOptional({
    description: 'IDs das mensagens a reprocessar (FAILED)',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  ids?: string[];

  @ApiPropertyOptional({
    description:
      'ID da configuração: reprocessa todas as mensagens FAILED desta configuração',
  })
  @IsOptional()
  @IsUUID()
  configurationId?: string;

  @ValidateIf((o: ReprocessWebhookMessagesDto) => !o.ids && !o.configurationId)
  requiredOneOf?: never;
}
