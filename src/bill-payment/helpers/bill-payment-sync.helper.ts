import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '@/common/logger/logger.service';
import { BillPayment } from '../entities/bill-payment.entity';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { BillPaymentProviderHelper } from './bill-payment-provider.helper';
import { BillPaymentDetailResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { BillPaymentStatus } from '../enums/bill-payment-status.enum';
import { sanitizeDocument } from './document-sanitizer.helper';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { mapBillPaymentStatusToTransactionStatus } from '@/common/helpers/status-mapper.helper';
import { parseISO } from '@/common/helpers/date.helpers';

/**
 * Helper responsável pela sincronização de dados de pagamento de contas com provedores externos.
 */
@Injectable()
export class BillPaymentSyncHelper {
  private readonly context = BillPaymentSyncHelper.name;

  constructor(
    @InjectRepository(BillPayment)
    private readonly repository: Repository<BillPayment>,
    private readonly providerHelper: BillPaymentProviderHelper,
    private readonly logger: AppLoggerService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Sincroniza os dados de um pagamento com o provedor financeiro.
   * Se houver sucesso, persiste as alterações no banco de dados e retorna o pagamento atualizado.
   * @param payment - Entidade do pagamento a ser sincronizado
   * @param session - Sessão do provedor
   * @returns Pagamento atualizado (ou original em caso de erro/pular)
   */
  async syncPaymentWithProvider(
    payment: BillPayment,
    session: ProviderSession,
  ): Promise<BillPayment> {
    // Sincronizar apenas pagamentos do Hiperbanco que possuem authenticationCode
    if (
      payment.providerSlug !== FinancialProvider.HIPERBANCO ||
      !payment.authenticationCode
    ) {
      return payment;
    }

    try {
      this.logger.log(
        `Fetching updated bill payment data from Hiperbanco: ${payment.id}`,
        this.context,
      );

      const detailData: BillPaymentDetailResponse =
        await this.providerHelper.getPaymentDetail(
          payment.providerSlug,
          payment.bankBranch,
          payment.bankAccount,
          payment.authenticationCode,
          session,
        );

      let hasUpdates = false;

      // Atualizar status
      if (detailData.status) {
        const newStatus = this.parseStatus(detailData.status);
        if (payment.status !== newStatus) {
          payment.status = newStatus;
          hasUpdates = true;
        }
      }

      // Atualizar valores
      if (
        detailData.amount !== undefined &&
        payment.amount !== detailData.amount
      ) {
        payment.amount = detailData.amount;
        hasUpdates = true;
      }

      if (
        detailData.originalAmount !== undefined &&
        payment.originalAmount !== detailData.originalAmount
      ) {
        payment.originalAmount = detailData.originalAmount;
        hasUpdates = true;
      }

      // Atualizar charges
      if (detailData.charges) {
        if (
          payment.interestAmount !== detailData.charges.interestAmountCalculated
        ) {
          payment.interestAmount = detailData.charges.interestAmountCalculated;
          hasUpdates = true;
        }
        if (payment.fineAmount !== detailData.charges.fineAmountCalculated) {
          payment.fineAmount = detailData.charges.fineAmountCalculated;
          hasUpdates = true;
        }
        if (payment.discountAmount !== detailData.charges.discountAmount) {
          payment.discountAmount = detailData.charges.discountAmount;
          hasUpdates = true;
        }
      }

      // Atualizar assignor
      if (detailData.assignor && payment.assignor !== detailData.assignor) {
        payment.assignor = detailData.assignor;
        hasUpdates = true;
      }

      // Atualizar recipient
      if (detailData.recipientName || detailData.recipientDocument) {
        payment.recipient = payment.recipient || ({} as any); // TypeORM validates on save
        if (
          detailData.recipientName &&
          payment.recipient.name !== detailData.recipientName
        ) {
          payment.recipient.name = detailData.recipientName;
          hasUpdates = true;
        }
        if (detailData.recipientDocument) {
          const sanitizedDoc = sanitizeDocument(detailData.recipientDocument);
          if (payment.recipient.documentNumber !== sanitizedDoc) {
            payment.recipient.documentNumber = sanitizedDoc;
            // Assuming documentType is handled elsewhere or not critical for sync
            hasUpdates = true;
          }
        }
      }

      // Atualizar digitable
      if (detailData.digitable && payment.digitable !== detailData.digitable) {
        payment.digitable = detailData.digitable;
        hasUpdates = true;
      }

      // Atualizar datas
      if (detailData.paymentDate) {
        const newDate = this.parseDate(detailData.paymentDate);
        if (
          newDate &&
          (!payment.paymentDate ||
            payment.paymentDate.getTime() !== newDate.getTime())
        ) {
          payment.paymentDate = newDate;
          hasUpdates = true;
        }
      }

      if (detailData.confirmedAt) {
        const newDate = this.parseDate(detailData.confirmedAt);
        if (
          newDate &&
          (!payment.confirmedAt ||
            payment.confirmedAt.getTime() !== newDate.getTime())
        ) {
          payment.confirmedAt = newDate;
          hasUpdates = true;
        }
      }

      if (detailData.settleDate) {
        const newDate = this.parseDate(detailData.settleDate);
        if (
          newDate &&
          (!payment.settleDate ||
            payment.settleDate.getTime() !== newDate.getTime())
        ) {
          payment.settleDate = newDate;
          hasUpdates = true;
        }
      }

      if (detailData.dueDate) {
        const newDate = this.parseDate(detailData.dueDate);
        if (
          newDate &&
          (!payment.dueDate || payment.dueDate.getTime() !== newDate.getTime())
        ) {
          payment.dueDate = newDate;
          hasUpdates = true;
        }
      }

      // Atualizar no banco de dados
      if (hasUpdates) {
        const updatedPayment = await this.repository.save(payment);

        this.logger.log(
          `Bill payment data synced from Hiperbanco: ${payment.id}`,
          this.context,
        );

        // Criar ou atualizar Transaction quando status mudar
        // Accessing mapped status effectively
        const mappedStatus = this.parseStatus(detailData.status || '');
        if (
          mappedStatus &&
          mappedStatus !== payment.status &&
          updatedPayment.authenticationCode
        ) {
          // Logic suggests if status CHANGED. But we updated payment.status above.
          // Original logic checked updateData.status.
          // We can just call it if we detected status change or just call it always if authCode exists?
          // Or better:
          await this.syncTransactionForPayment(updatedPayment);
        } else if (updatedPayment.authenticationCode && hasUpdates) {
          // Maybe timestamps changed?
          // Original only checked updateData.status.
          // Let's stick to status change trigger or simplified check?
          // safely calling it is idempotent usually (updateStatus or create)
          // The original code: if (updateData.status && ...)
          // So only if status was in payload.
          if (detailData.status) {
            await this.syncTransactionForPayment(updatedPayment);
          }
        }

        return updatedPayment;
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync bill payment from Hiperbanco: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
    }

    return payment;
  }

  /**
   * Cria ou atualiza uma Transaction para o pagamento.
   */
  private async syncTransactionForPayment(payment: BillPayment): Promise<void> {
    try {
      const transactionStatus = mapBillPaymentStatusToTransactionStatus(
        payment.status,
      );

      const existingTx = await this.transactionService.findByAuthenticationCode(
        payment.authenticationCode!,
      );

      if (!existingTx) {
        await this.transactionService.createFromWebhook({
          authenticationCode: payment.authenticationCode!,
          type: TransactionType.BILL_PAYMENT,
          status: transactionStatus,
          amount: payment.amount,
          clientId: payment.clientId,
          accountId: payment.accountId,
          billPaymentId: payment.id,
          providerTimestamp: payment.paymentDate,
        });

        this.logger.log(
          `Transaction created for bill payment: ${payment.id}`,
          this.context,
        );
      } else {
        await this.transactionService.updateStatus(
          payment.authenticationCode!,
          transactionStatus,
        );

        this.logger.log(
          `Transaction status updated for bill payment: ${payment.id}`,
          this.context,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync transaction for bill payment: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
    }
  }

  /**
   * Converte string de status da API para enum.
   */
  private parseStatus(status: string): BillPaymentStatus {
    const statusMap: Record<string, BillPaymentStatus> = {
      Created: BillPaymentStatus.CREATED,
      Completed: BillPaymentStatus.COMPLETED,
      Confirmed: BillPaymentStatus.CONFIRMED,
      Cancelled: BillPaymentStatus.CANCELLED,
    };

    return statusMap[status] || BillPaymentStatus.CREATED;
  }

  /**
   * Converte string de data no formato "DD/MM/YYYY HH:mm:ss" ou ISO para Date.
   */
  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    // Tenta parse ISO primeiro
    const isoDate = parseISO(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Tenta formato "DD/MM/YYYY HH:mm:ss" ou "DD/MM/YYYY HH:mm"
    const parts = dateStr.match(
      /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/,
    );
    if (parts) {
      const [, day, month, year, hour, minute, second = '0'] = parts;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second),
      );
    }

    return undefined;
  }
}
