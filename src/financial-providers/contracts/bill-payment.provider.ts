import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from './provider-session';
import type { ConfirmBillPaymentDto } from '@/bill-payment/dto/confirm-bill-payment.dto';
import type {
  BillPaymentValidateResponse,
  BillPaymentConfirmResponse,
  BillPaymentDetailResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';

export interface BillPaymentProvider {
  readonly providerSlug: FinancialProvider;

  validateBill(
    digitable: string,
    session: ProviderSession,
  ): Promise<BillPaymentValidateResponse>;

  confirmPayment(
    dto: ConfirmBillPaymentDto,
    session: ProviderSession,
  ): Promise<BillPaymentConfirmResponse>;

  getPaymentDetail(
    bankBranch: string,
    bankAccount: string,
    authenticationCode: string,
    session: ProviderSession,
  ): Promise<BillPaymentDetailResponse>;
}
