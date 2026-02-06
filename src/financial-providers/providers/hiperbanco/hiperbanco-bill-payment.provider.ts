import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { BillPaymentProvider } from '@/financial-providers/contracts/bill-payment.provider';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import type { ConfirmBillPaymentDto } from '@/bill-payment/dto/confirm-bill-payment.dto';
import type {
  BillPaymentConfirmResponse,
  BillPaymentDetailResponse,
  BillPaymentValidateResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { HiperbancoBillPaymentHelper } from '@/bill-payment/helpers/hiperbanco/hiperbanco-bill-payment.helper';

@Injectable()
export class HiperbancoBillPaymentProvider implements BillPaymentProvider {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  constructor(private readonly helper: HiperbancoBillPaymentHelper) {}

  validateBill(
    digitable: string,
    session: ProviderSession,
  ): Promise<BillPaymentValidateResponse> {
    return this.helper.validateBill(digitable, session);
  }

  confirmPayment(
    dto: ConfirmBillPaymentDto,
    session: ProviderSession,
  ): Promise<BillPaymentConfirmResponse> {
    return this.helper.confirmPayment(dto, session);
  }

  getPaymentDetail(
    bankBranch: string,
    bankAccount: string,
    authenticationCode: string,
    session: ProviderSession,
  ): Promise<BillPaymentDetailResponse> {
    return this.helper.getPaymentDetail(
      bankBranch,
      bankAccount,
      authenticationCode,
      session,
    );
  }
}
