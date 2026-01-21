import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionSemanticStatus } from '../enums/transaction-semantic-status.enum';
import { TransactionSource } from '../types/transaction-source.type';
import { ITransactionResponse } from '../interfaces/transaction-response.interface';

export class TransactionResponseDto implements ITransactionResponse {
  @ApiProperty({ description: 'ID da transação' })
  id: string;

  @ApiProperty({ description: 'Código de autenticação da transação' })
  authenticationCode: string;

  @ApiProperty({ enum: TransactionType, description: 'Tipo da transação' })
  type: TransactionType;

  @ApiProperty({
    enum: TransactionSemanticStatus,
    description: 'Status semântico/simplificado da transação',
  })
  status: TransactionSemanticStatus;

  @ApiProperty({
    enum: TransactionStatus,
    description: 'Status detalhado/original da transação',
  })
  detailedStatus: TransactionStatus;

  @ApiProperty({ description: 'Valor da transação', example: 100.5 })
  amount: number;

  @ApiProperty({ description: 'Moeda da transação', example: 'BRL' })
  currency: string;

  @ApiProperty({
    description: 'Descrição da transação',
    required: false,
    nullable: true,
  })
  description?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Timestamp do provedor',
    required: false,
    nullable: true,
  })
  providerTimestamp?: Date;

  @ApiProperty({
    description: 'Detalhes específicos da operação (Pix, Boleto, etc)',
    required: false,
    nullable: true,
  })
  details?: Partial<TransactionSource>;
}
