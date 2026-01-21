import { Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import {
  HiperbancoTedHelper,
  HiperbancoTedResponse,
  HiperbancoTedStatusResponse,
} from './hiperbanco/hiperbanco-ted.helper';
import { ITedTransferRequest } from '../interfaces/ted-transfer-request.interface';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';

@Injectable()
export class TedProviderHelper {
  constructor(private readonly hiperbancoHelper: HiperbancoTedHelper) {}

  async createTransfer(
    provider: FinancialProvider,
    transferRequest: ITedTransferRequest,
    session: ProviderSession,
  ): Promise<HiperbancoTedResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.createTransfer(transferRequest, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for TED`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  async getTransferStatus(
    provider: FinancialProvider,
    authenticationCode: string,
    branch: string,
    account: string,
    session: ProviderSession,
  ): Promise<HiperbancoTedStatusResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.getTransferStatus(
          authenticationCode,
          branch,
          account,
          session,
        );
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for TED`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }
}
