import { Transaction } from '../entities/transaction.entity';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { getSemanticStatus } from './transaction-status.helper';
import { TransactionSource } from '../types/transaction-source.type';

export class TransactionMapper {
  static toResponse(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.authenticationCode = transaction.authenticationCode;
    dto.type = transaction.type;
    dto.detailedStatus = transaction.status;
    dto.status = getSemanticStatus(transaction.status);
    dto.amount = Number(transaction.amount);
    dto.currency = transaction.currency;
    dto.description = transaction.description;
    dto.createdAt = transaction.createdAt;
    dto.updatedAt = transaction.updatedAt;
    dto.providerTimestamp = transaction.providerTimestamp;

    const sourceRelation =
      transaction.pixCashIn ||
      transaction.pixTransfer ||
      transaction.pixRefund ||
      transaction.boleto ||
      transaction.billPayment ||
      transaction.pixQrCode ||
      transaction.tedTransfer ||
      transaction.tedCashIn ||
      transaction.tedRefund;

    if (sourceRelation) {
      dto.details = this.cleanDetails(sourceRelation, dto);
    }

    return dto;
  }

  private static cleanDetails(
    source: TransactionSource,
    parentDto: TransactionResponseDto,
  ): Partial<TransactionSource> {
    if (!parentDto.description && source.description) {
      parentDto.description = source.description;
    }

    const clean = { ...source } as Partial<TransactionSource> & {
      authenticationCode?: string;
      providerTimestamp?: Date;
    };

    delete clean.amount;
    delete clean.currency;
    delete clean.description;
    delete clean.authenticationCode;
    delete clean.providerTimestamp;
    delete clean.createdAt;
    delete clean.updatedAt;
    delete clean.deletedAt;
    delete clean.providerSlug;

    return clean;
  }
}
