import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { PixProvider } from '@/financial-providers/contracts/pix.provider';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import { HiperbancoPixHelper } from '@/pix/helpers/hiperbanco/hiperbanco-pix.helper';
import type {
  PixGetKeysResponse,
  PixRegisterKeyResponse,
  PixValidateKeyResponse,
  PixTransferResponse,
  PixQrCodeGenerateResponse,
  PixQrCodeDecodeResponse,
  PixTransferStatusResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import type { RegisterPixKeyDto } from '@/pix/dto/register-pix-key.dto';
import type { GenerateTotpDto } from '@/pix/dto/generate-totp.dto';
import type { GenerateStaticQrCodeDto } from '@/pix/dto/generate-static-qr-code.dto';
import type { GenerateDynamicQrCodeDto } from '@/pix/dto/generate-dynamic-qr-code.dto';
import type { DecodeQrCodeDto } from '@/pix/dto/decode-qr-code.dto';
import type { TransferPayload } from '@/pix/interfaces/transfer-payload.interface';

@Injectable()
export class HiperbancoPixProvider implements PixProvider {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  constructor(private readonly helper: HiperbancoPixHelper) {}

  getPixKeys(
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixGetKeysResponse> {
    return this.helper.getPixKeys(accountNumber, session);
  }

  registerPixKey(
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixRegisterKeyResponse> {
    return this.helper.registerPixKey(
      dto,
      accountBranch,
      accountNumber,
      session,
    );
  }

  deletePixKey(addressKey: string, session: ProviderSession): Promise<void> {
    return this.helper.deletePixKey(addressKey, session);
  }

  generateTotpCode(
    dto: GenerateTotpDto,
    session: ProviderSession,
  ): Promise<void> {
    return this.helper.generateTotpCode(dto, session);
  }

  validatePixKey(
    addressingKey: string,
    session: ProviderSession,
  ): Promise<PixValidateKeyResponse> {
    return this.helper.validatePixKey(addressingKey, session);
  }

  transfer(
    payload: TransferPayload,
    session: ProviderSession,
    idempotencyKey?: string,
  ): Promise<PixTransferResponse> {
    return this.helper.transfer(payload, session, idempotencyKey);
  }

  getTransferStatus(
    accountNumber: string,
    authenticationCode: string,
    session: ProviderSession,
  ): Promise<PixTransferStatusResponse> {
    return this.helper.getTransfer(accountNumber, authenticationCode, session);
  }

  generateStaticQrCode(
    dto: GenerateStaticQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeGenerateResponse> {
    return this.helper.generateStaticQrCode(dto, session);
  }

  generateDynamicQrCode(
    dto: GenerateDynamicQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeGenerateResponse> {
    return this.helper.generateDynamicQrCode(dto, session);
  }

  decodeQrCode(
    dto: DecodeQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeDecodeResponse> {
    return this.helper.decodeQrCode(dto, session);
  }
}
