import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from './provider-session';
import type { ITedTransferRequest } from '@/ted/interfaces/ted-transfer-request.interface';
import type {
  HiperbancoTedResponse,
  HiperbancoTedStatusResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';

export interface TedProvider {
  readonly providerSlug: FinancialProvider;

  createTransfer(
    transferRequest: ITedTransferRequest,
    session: ProviderSession,
  ): Promise<HiperbancoTedResponse>;

  getTransferStatus(
    authenticationCode: string,
    branch: string,
    account: string,
    session: ProviderSession,
  ): Promise<HiperbancoTedStatusResponse>;
}
