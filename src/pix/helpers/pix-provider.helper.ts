import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import { PixProviderRegistry } from '@/financial-providers/registry/pix-provider.registry';
import {
  PixGetKeysResponse,
  PixRegisterKeyResponse,
  PixValidateKeyResponse,
  PixTransferResponse,
  PixQrCodeGenerateResponse,
  PixQrCodeDecodeResponse,
  PixTransferStatusResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { RegisterPixKeyDto } from '../dto/register-pix-key.dto';
import { GenerateTotpDto } from '../dto/generate-totp.dto';
import { GenerateStaticQrCodeDto } from '../dto/generate-static-qr-code.dto';
import { GenerateDynamicQrCodeDto } from '../dto/generate-dynamic-qr-code.dto';
import { TransferPayload } from '../interfaces/transfer-payload.interface';

@Injectable()
export class PixProviderHelper {
  constructor(private readonly registry: PixProviderRegistry) {}

  async getPixKeys(
    provider: FinancialProvider,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixGetKeysResponse> {
    return this.registry.get(provider).getPixKeys(accountNumber, session);
  }

  async registerPixKey(
    provider: FinancialProvider,
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixRegisterKeyResponse> {
    return this.registry
      .get(provider)
      .registerPixKey(dto, accountBranch, accountNumber, session);
  }

  async deletePixKey(
    provider: FinancialProvider,
    addressKey: string,
    session: ProviderSession,
  ): Promise<void> {
    return this.registry.get(provider).deletePixKey(addressKey, session);
  }

  async generateTotpCode(
    provider: FinancialProvider,
    dto: GenerateTotpDto,
    session: ProviderSession,
  ): Promise<void> {
    return this.registry.get(provider).generateTotpCode(dto, session);
  }

  async validatePixKey(
    provider: FinancialProvider,
    addressingKey: string,
    session: ProviderSession,
  ): Promise<PixValidateKeyResponse> {
    return this.registry.get(provider).validatePixKey(addressingKey, session);
  }

  async transfer(
    provider: FinancialProvider,
    payload: TransferPayload,
    session: ProviderSession,
    idempotencyKey?: string,
  ): Promise<PixTransferResponse> {
    return this.registry
      .get(provider)
      .transfer(payload, session, idempotencyKey);
  }

  async getTransferStatus(
    provider: FinancialProvider,
    accountNumber: string,
    authenticationCode: string,
    session: ProviderSession,
  ): Promise<PixTransferStatusResponse> {
    return this.registry
      .get(provider)
      .getTransferStatus(accountNumber, authenticationCode, session);
  }

  async generateStaticQrCode(
    provider: FinancialProvider,
    dto: GenerateStaticQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeGenerateResponse> {
    return this.registry.get(provider).generateStaticQrCode(dto, session);
  }

  async generateDynamicQrCode(
    provider: FinancialProvider,
    dto: GenerateDynamicQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeGenerateResponse> {
    return this.registry.get(provider).generateDynamicQrCode(dto, session);
  }

  async decodeQrCode(
    provider: FinancialProvider,
    code: string,
    session: ProviderSession,
  ): Promise<PixQrCodeDecodeResponse> {
    return this.registry.get(provider).decodeQrCode(code, session);
  }
}
