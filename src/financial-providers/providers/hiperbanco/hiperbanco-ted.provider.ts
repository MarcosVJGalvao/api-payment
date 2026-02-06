import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { TedProvider } from '@/financial-providers/contracts/ted.provider';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import type { ITedTransferRequest } from '@/ted/interfaces/ted-transfer-request.interface';
import type {
  HiperbancoTedResponse,
  HiperbancoTedStatusResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { HiperbancoTedHelper } from '@/ted/helpers/hiperbanco/hiperbanco-ted.helper';

@Injectable()
export class HiperbancoTedProvider implements TedProvider {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  constructor(private readonly helper: HiperbancoTedHelper) {}

  createTransfer(
    transferRequest: ITedTransferRequest,
    session: ProviderSession,
  ): Promise<HiperbancoTedResponse> {
    return this.helper.createTransfer(transferRequest, session);
  }

  getTransferStatus(
    authenticationCode: string,
    branch: string,
    account: string,
    session: ProviderSession,
  ): Promise<HiperbancoTedStatusResponse> {
    return this.helper.getTransferStatus(
      authenticationCode,
      branch,
      account,
      session,
    );
  }
}
