import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import { BillPaymentProviderRegistry } from '@/financial-providers/registry/bill-payment-provider.registry';
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
  constructor(private readonly registry: BillPaymentProviderRegistry) {}

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
    return this.registry.get(provider).validateBill(digitable, session);
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
    return this.registry.get(provider).confirmPayment(dto, session);
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
    return this.registry
      .get(provider)
      .getPaymentDetail(bankBranch, bankAccount, authenticationCode, session);
  }
}
