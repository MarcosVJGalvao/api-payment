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

      // Preparar objeto com campos a serem atualizados
      const updateData: Partial<BillPayment> = {};

      // Atualizar status
      if (detailData.status) {
        updateData.status = this.parseStatus(detailData.status);
      }

      // Atualizar valores
      if (detailData.amount !== undefined) {
        updateData.amount = detailData.amount;
      }

      if (detailData.originalAmount !== undefined) {
        updateData.originalAmount = detailData.originalAmount;
      }

      // Atualizar charges
      if (detailData.charges) {
        updateData.interestAmount = detailData.charges.interestAmountCalculated;
        updateData.fineAmount = detailData.charges.fineAmountCalculated;
        updateData.discountAmount = detailData.charges.discountAmount;
      }

      // Atualizar assignor e recipient
      if (detailData.assignor) {
        updateData.assignor = detailData.assignor;
      }

      if (detailData.recipientName) {
        updateData.recipientName = detailData.recipientName;
      }

      if (detailData.recipientDocument) {
        updateData.recipientDocument = detailData.recipientDocument;
      }

      // Atualizar datas
      if (detailData.paymentDate) {
        updateData.paymentDate = this.parseDate(detailData.paymentDate);
      }

      if (detailData.confirmedAt) {
        updateData.confirmedAt = this.parseDate(detailData.confirmedAt);
      }

      if (detailData.settleDate) {
        updateData.settleDate = this.parseDate(detailData.settleDate);
      }

      // Atualizar no banco de dados
      if (Object.keys(updateData).length > 0) {
        await this.repository.update(payment.id, updateData);

        const updatedPayment = await this.repository.findOne({
          where: { id: payment.id },
        });
        if (updatedPayment) {
          this.logger.log(
            `Bill payment data synced from Hiperbanco: ${payment.id}`,
            this.context,
          );
          return updatedPayment;
        }
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
    const isoDate = new Date(dateStr);
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
