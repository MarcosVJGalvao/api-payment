import { Transaction } from '../entities/transaction.entity';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { getSemanticStatus } from './transaction-status.helper';
import { TransactionSource } from '../types/transaction-source.type';
import { ITransactionSummary } from '../interfaces/transaction-summary.interface';

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
    dto.description = this.getDescription(transaction);
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

  static toSummary(transaction: Transaction): ITransactionSummary {
    return {
      id: transaction.id,
      type: transaction.type,
      status: getSemanticStatus(transaction.status),
      detailedStatus: transaction.status,
      description: this.getDescription(transaction),
      amount: Number(transaction.amount),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      providerTimestamp: transaction.providerTimestamp,
      senderName: this.getSenderName(transaction),
      recipientName: this.getRecipientName(transaction),
    };
  }

  private static getDescription(transaction: Transaction): string | null {
    if (transaction.description) return transaction.description;

    if (transaction.pixTransfer?.description)
      return transaction.pixTransfer.description;
    if (transaction.tedTransfer?.description)
      return transaction.tedTransfer.description;
    if (transaction.billPayment?.description)
      return transaction.billPayment.description;
    if (transaction.pixCashIn?.description)
      return transaction.pixCashIn.description;

    return null;
  }

  private static getSenderName(transaction: Transaction): string | null {
    if (transaction.pixCashIn?.sender?.name)
      return transaction.pixCashIn.sender.name;
    if (transaction.pixTransfer?.sender?.name)
      return transaction.pixTransfer.sender.name;
    if (transaction.tedCashIn?.sender?.name)
      return transaction.tedCashIn.sender.name;
    if (transaction.tedTransfer?.sender?.name)
      return transaction.tedTransfer.sender.name;
    if (transaction.boleto?.payer?.name) return transaction.boleto.payer.name;
    if (transaction.pixQrCode?.payer?.name)
      return transaction.pixQrCode.payer.name;
    return null;
  }

  private static getRecipientName(transaction: Transaction): string | null {
    if (transaction.pixCashIn?.recipient?.name)
      return transaction.pixCashIn.recipient.name;
    if (transaction.pixTransfer?.recipient?.name)
      return transaction.pixTransfer.recipient.name;
    if (transaction.tedCashIn?.recipient?.name)
      return transaction.tedCashIn.recipient.name;
    if (transaction.tedTransfer?.recipient?.name)
      return transaction.tedTransfer.recipient.name;
    if (transaction.billPayment?.recipient?.name)
      return transaction.billPayment.recipient.name;
    if (transaction.pixQrCode?.recipientName)
      return transaction.pixQrCode.recipientName;
    return null;
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
