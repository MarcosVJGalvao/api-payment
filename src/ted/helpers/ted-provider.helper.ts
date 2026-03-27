import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import {
  HiperbancoTedResponse,
  HiperbancoTedStatusResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { ITedTransferRequest } from '../interfaces/ted-transfer-request.interface';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import { TedProviderRegistry } from '@/financial-providers/registry/ted-provider.registry';

@Injectable()
export class TedProviderHelper {
  constructor(private readonly registry: TedProviderRegistry) {}

  async createTransfer(
    provider: FinancialProvider,
    transferRequest: ITedTransferRequest,
    session: ProviderSession,
  ): Promise<HiperbancoTedResponse> {
    return this.registry.get(provider).createTransfer(transferRequest, session);
  }

  async getTransferStatus(
    provider: FinancialProvider,
    authenticationCode: string,
    branch: string,
    account: string,
    session: ProviderSession,
  ): Promise<HiperbancoTedStatusResponse> {
    return this.registry
      .get(provider)
      .getTransferStatus(authenticationCode, branch, account, session);
  }
}
