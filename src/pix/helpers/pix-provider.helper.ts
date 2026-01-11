import { Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HiperbancoPixHelper } from './hiperbanco/hiperbanco-pix.helper';
import {
  PixGetKeysResponse,
  PixRegisterKeyResponse,
  PixValidateKeyResponse,
  PixTransferResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { RegisterPixKeyDto } from '../dto/register-pix-key.dto';
import { GenerateTotpDto } from '../dto/generate-totp.dto';
import { TransferPayload } from '../interfaces/transfer-payload.interface';

@Injectable()
export class PixProviderHelper {
  constructor(private readonly hiperbancoHelper: HiperbancoPixHelper) {}

  async getPixKeys(
    provider: FinancialProvider,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixGetKeysResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.getPixKeys(accountNumber, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  async registerPixKey(
    provider: FinancialProvider,
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixRegisterKeyResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.registerPixKey(
          dto,
          accountBranch,
          accountNumber,
          session,
        );
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  async deletePixKey(
    provider: FinancialProvider,
    addressKey: string,
    session: ProviderSession,
  ): Promise<void> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.deletePixKey(addressKey, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  async generateTotpCode(
    provider: FinancialProvider,
    dto: GenerateTotpDto,
    session: ProviderSession,
  ): Promise<void> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.generateTotpCode(dto, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  async validatePixKey(
    provider: FinancialProvider,
    addressingKey: string,
    session: ProviderSession,
  ): Promise<PixValidateKeyResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.validatePixKey(addressingKey, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  async transfer(
    provider: FinancialProvider,
    payload: TransferPayload,
    session: ProviderSession,
    idempotencyKey?: string,
  ): Promise<PixTransferResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.transfer(payload, session, idempotencyKey);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }
}
