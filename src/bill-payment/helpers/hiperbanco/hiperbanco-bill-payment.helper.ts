import { Injectable } from '@nestjs/common';
import { HiperbancoHttpService } from '@/financial-providers/hiperbanco/hiperbanco-http.service';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import {
  BillPaymentValidateResponse,
  BillPaymentConfirmResponse,
  BillPaymentDetailResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { HiperbancoEndpoint } from '@/financial-providers/hiperbanco/enums/hiperbanco-endpoint.enum';
import { ConfirmBillPaymentDto } from '../../dto/confirm-bill-payment.dto';

/**
 * Helper responsável pela comunicação com o Hiperbanco para operações de pagamento de contas.
 */
@Injectable()
export class HiperbancoBillPaymentHelper {
  constructor(private readonly hiperbancoHttp: HiperbancoHttpService) {}

  /**
   * Valida um título pela linha digitável no Hiperbanco.
   * @param digitable Linha digitável do título.
   * @param session Sessão autenticada do provedor.
   * @returns Resposta do Hiperbanco com dados da validação.
   */
  async validateBill(
    digitable: string,
    session: ProviderSession,
  ): Promise<BillPaymentValidateResponse> {
    const path = `${HiperbancoEndpoint.BILL_PAYMENT_VALIDATE}/${digitable}`;

    return this.hiperbancoHttp.patch<BillPaymentValidateResponse>(
      path,
      {},
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  /**
   * Confirma um pagamento de conta no Hiperbanco.
   * @param dto Dados para confirmação do pagamento.
   * @param session Sessão autenticada do provedor.
   * @returns Resposta do Hiperbanco com código de autenticação e transação.
   */
  async confirmPayment(
    dto: ConfirmBillPaymentDto,
    session: ProviderSession,
  ): Promise<BillPaymentConfirmResponse> {
    const payload = {
      id: dto.id,
      bankBranch: dto.bankBranch,
      bankAccount: dto.bankAccount,
      amount: dto.amount,
      description: dto.description,
    };

    return this.hiperbancoHttp.post<BillPaymentConfirmResponse>(
      HiperbancoEndpoint.BILL_PAYMENT_CONFIRM,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  /**
   * Consulta os detalhes de um pagamento no Hiperbanco.
   * @param bankBranch Agência da conta.
   * @param bankAccount Número da conta.
   * @param authenticationCode Código de autenticação do pagamento.
   * @param session Sessão autenticada do provedor.
   * @returns Resposta do Hiperbanco com dados detalhados do pagamento.
   */
  async getPaymentDetail(
    bankBranch: string,
    bankAccount: string,
    authenticationCode: string,
    session: ProviderSession,
  ): Promise<BillPaymentDetailResponse> {
    const path = `${HiperbancoEndpoint.BILL_PAYMENT_DETAIL}/${bankBranch}/${bankAccount}/${authenticationCode}`;

    return this.hiperbancoHttp.get<BillPaymentDetailResponse>(path, {
      headers: {
        Authorization: `Bearer ${session.hiperbancoToken}`,
      },
    });
  }
}
