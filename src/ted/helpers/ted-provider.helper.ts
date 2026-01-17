import { Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import {
  HiperbancoTedHelper,
  HiperbancoTedResponse,
  HiperbancoTedStatusResponse,
} from './hiperbanco/hiperbanco-ted.helper';
import { CreateTedDto } from '../dto/create-ted.dto';

@Injectable()
export class TedProviderHelper {
  constructor(private readonly hiperbancoHelper: HiperbancoTedHelper) {}

  async createTransfer(
    provider: FinancialProvider,
    dto: CreateTedDto,
  ): Promise<HiperbancoTedResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.createTransfer(dto);
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
  ): Promise<HiperbancoTedStatusResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.getTransferStatus(
          authenticationCode,
          branch,
          account,
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
