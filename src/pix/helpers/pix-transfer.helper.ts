import { PixTransferDto } from '../dto/pix-transfer.dto';
import { PixTransferStatus } from '../enums/pix-transfer-status.enum';
import { PixTransactionType } from '../enums/pix-transaction-type.enum';
import { PixAccountType } from '../enums/pix-account-type.enum';
import { PixInitializationType } from '../enums/pix-initialization-type.enum';
import { TransferPayload } from '../interfaces/transfer-payload.interface';

/**
 * Dados da conta para construção do payload de transferência.
 */
export interface TransferAccountData {
  branch: string;
  number: string;
}

/**
 * Dados do onboarding para construção do payload de transferência.
 */
export interface TransferOnboardingData {
  documentNumber: string;
  registerName: string;
}

/**
 * Constrói o payload de transferência PIX baseado no tipo de inicialização.
 */
export function buildTransferPayload(
  dto: PixTransferDto,
  account: TransferAccountData,
  onboarding: TransferOnboardingData,
): TransferPayload {
  const basePayload = {
    sender: {
      account: {
        type: PixAccountType.CHECKING,
        branch: account.branch,
        number: account.number,
      },
      documentNumber: onboarding.documentNumber,
      name: onboarding.registerName,
    },
    amount: dto.amount,
    initializationType: dto.initializationType,
    paymentDate: dto.paymentDate || '',
  };

  if (dto.initializationType === PixInitializationType.MANUAL) {
    return {
      ...basePayload,
      transactionNotes: dto.description,
      recipient: {
        documentNumber: dto.recipient!.documentNumber,
        name: dto.recipient!.name,
        account: dto.recipient!.account,
        bank: dto.recipient!.bank,
      },
    };
  }

  const keyPayload = {
    ...basePayload,
    transactionNotes: dto.description,
    endToEndId: dto.endToEndId,
    pixKey: dto.pixKey,
  };

  if (dto.initializationType === PixInitializationType.STATIC_QR_CODE) {
    return { ...keyPayload, conciliationId: dto.conciliationId };
  }

  if (dto.initializationType === PixInitializationType.DYNAMIC_QR_CODE) {
    return {
      ...keyPayload,
      receiverReconciliationId: dto.receiverReconciliationId,
    };
  }

  return keyPayload;
}

/**
 * Mapeia o tipo de transação do provedor para o enum PixTransactionType.
 */
export function mapTransactionType(
  type?: string,
): PixTransactionType | undefined {
  if (!type) return undefined;
  if (type === 'CASH_OUT') return PixTransactionType.DEBIT;
  if (type === 'CASH_IN') return PixTransactionType.CREDIT;
  return undefined;
}

/**
 * Mapeia o status retornado pelo provedor para o enum PixTransferStatus.
 */
export function mapPixTransferStatus(
  status: string | undefined,
  defaultStatus: PixTransferStatus,
): PixTransferStatus {
  if (!status) return defaultStatus;

  const statusMap: Record<string, PixTransferStatus> = {
    CREATED: PixTransferStatus.CREATED,
    IN_PROCESS: PixTransferStatus.IN_PROCESS,
    APPROVED: PixTransferStatus.APPROVED,
    REPROVED: PixTransferStatus.REPROVED,
    DONE: PixTransferStatus.DONE,
    UNDONE: PixTransferStatus.UNDONE,
    CANCELED: PixTransferStatus.CANCELED,
  };

  return statusMap[status] ?? defaultStatus;
}
