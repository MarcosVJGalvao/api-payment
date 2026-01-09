import { Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HiperbancoBillPaymentHelper } from './hiperbanco/hiperbanco-bill-payment.helper';
import {
  BillPaymentValidateResponse,
  BillPaymentConfirmResponse,
  BillPaymentDetailResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { ConfirmBillPaymentDto } from '../dto/confirm-bill-payment.dto';

/**
 * Helper responsável por rotear requisições de pagamento de contas para o provedor correto.
 */
@Injectable()
export class BillPaymentProviderHelper {
  constructor(private readonly hiperbancoHelper: HiperbancoBillPaymentHelper) {}

  /**
   * Valida um título no provedor especificado.
   * @param provider - Provedor financeiro
   * @param digitable - Linha digitável do título
   * @param session - Sessão autenticada do provedor
   * @returns Resposta da validação
   */
  async validateBill(
    provider: FinancialProvider,
    digitable: string,
    session: ProviderSession,
  ): Promise<BillPaymentValidateResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.validateBill(digitable, session);
      default:
        throw new CustomHttpException(
          `Provider ${provider} is not supported`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  /**
   * Confirma um pagamento no provedor especificado.
   * @param provider - Provedor financeiro
   * @param dto - Dados para confirmação
   * @param session - Sessão autenticada do provedor
   * @returns Resposta da confirmação
   */
  async confirmPayment(
    provider: FinancialProvider,
    dto: ConfirmBillPaymentDto,
    session: ProviderSession,
  ): Promise<BillPaymentConfirmResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.confirmPayment(dto, session);
      default:
        throw new CustomHttpException(
          `Provider ${provider} is not supported`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  /**
   * Consulta detalhes de um pagamento no provedor especificado.
   * @param provider - Provedor financeiro
   * @param bankBranch - Agência da conta
   * @param bankAccount - Número da conta
   * @param authenticationCode - Código de autenticação
   * @param session - Sessão autenticada do provedor
   * @returns Resposta com detalhes do pagamento
   */
  async getPaymentDetail(
    provider: FinancialProvider,
    bankBranch: string,
    bankAccount: string,
    authenticationCode: string,
    session: ProviderSession,
  ): Promise<BillPaymentDetailResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.getPaymentDetail(
          bankBranch,
          bankAccount,
          authenticationCode,
          session,
        );
      default:
        throw new CustomHttpException(
          `Provider ${provider} is not supported`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }
}
