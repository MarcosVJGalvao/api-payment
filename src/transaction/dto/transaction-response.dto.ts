import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionSemanticStatus } from '../enums/transaction-semantic-status.enum';
import { getSemanticStatus } from '../helpers/transaction-status.helper';

export class TransactionResponseDto {
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

  constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.authenticationCode = transaction.authenticationCode;
    this.type = transaction.type;
    this.detailedStatus = transaction.status;
    this.status = getSemanticStatus(transaction.status);
    this.amount = Number(transaction.amount); // Ensure it's a number
    this.currency = transaction.currency;
    this.description = transaction.description;
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
    this.providerTimestamp = transaction.providerTimestamp;
  }
}
