import { Injectable } from '@nestjs/common';
import { HiperbancoHttpService } from '@/financial-providers/hiperbanco/hiperbanco-http.service';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import {
  PixGetKeysResponse,
  PixRegisterKeyResponse,
  PixValidateKeyResponse,
  PixTransferResponse,
  PixQrCodeGenerateResponse,
  PixQrCodeDecodeResponse,
  PixTransferStatusResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { HiperbancoEndpoint } from '@/financial-providers/hiperbanco/enums/hiperbanco-endpoint.enum';
import { RegisterPixKeyDto } from '@/pix/dto/register-pix-key.dto';
import { GenerateTotpDto } from '@/pix/dto/generate-totp.dto';
import { GenerateStaticQrCodeDto } from '@/pix/dto/generate-static-qr-code.dto';
import { GenerateDynamicQrCodeDto } from '@/pix/dto/generate-dynamic-qr-code.dto';
import { PixKeyType } from '@/pix/enums/pix-key-type.enum';
import { PixAccountType } from '@/pix/enums/pix-account-type.enum';
import { TransferPayload } from '@/pix/interfaces/transfer-payload.interface';

@Injectable()
export class HiperbancoPixHelper {
  constructor(private readonly hiperbancoHttp: HiperbancoHttpService) {}

  async getPixKeys(
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixGetKeysResponse> {
    const path = `${HiperbancoEndpoint.PIX_GET_KEYS}/${accountNumber}`;

    return this.hiperbancoHttp.get<PixGetKeysResponse>(path, {
      headers: {
        Authorization: `Bearer ${session.hiperbancoToken}`,
      },
    });
  }

  async registerPixKey(
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixRegisterKeyResponse> {
    const payload = this.buildRegisterPayload(
      dto,
      accountBranch,
      accountNumber,
    );

    return this.hiperbancoHttp.post<PixRegisterKeyResponse>(
      HiperbancoEndpoint.PIX_REGISTER_KEY,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  async deletePixKey(
    addressKey: string,
    session: ProviderSession,
  ): Promise<void> {
    const path = `${HiperbancoEndpoint.PIX_DELETE_KEY}/${encodeURIComponent(addressKey)}`;

    await this.hiperbancoHttp.delete(path, {
      headers: {
        Authorization: `Bearer ${session.hiperbancoToken}`,
      },
    });
  }

  async generateTotpCode(
    dto: GenerateTotpDto,
    session: ProviderSession,
  ): Promise<void> {
    const payload = {
      operation: dto.operation,
      totpData: {
        addressingKey: {
          type: dto.type,
          value: dto.value,
        },
        ...(dto.pixKeyClaimId && { pixKeyClaimId: dto.pixKeyClaimId }),
      },
    };

    await this.hiperbancoHttp.post(
      HiperbancoEndpoint.PIX_GENERATE_TOTP,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  async validatePixKey(
    addressingKey: string,
    session: ProviderSession,
  ): Promise<PixValidateKeyResponse> {
    const path = `${HiperbancoEndpoint.PIX_VALIDATE_KEY}/${encodeURIComponent(addressingKey)}`;

    return this.hiperbancoHttp.get<PixValidateKeyResponse>(path, {
      headers: {
        Authorization: `Bearer ${session.hiperbancoToken}`,
      },
    });
  }

  async transfer(
    payload: TransferPayload,
    session: ProviderSession,
    idempotencyKey?: string,
  ): Promise<PixTransferResponse> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.hiperbancoToken}`,
      version: 'cutting-edge',
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return this.hiperbancoHttp.post<PixTransferResponse>(
      HiperbancoEndpoint.PIX_TRANSFER,
      payload,
      { headers },
    );
  }

  async getTransfer(
    accountNumber: string,
    authenticationCode: string,
    session: ProviderSession,
  ): Promise<PixTransferStatusResponse> {
    const path = `${HiperbancoEndpoint.PIX_TRANSFER}/${accountNumber}/${authenticationCode}`;

    return this.hiperbancoHttp.get<PixTransferStatusResponse>(path, {
      headers: {
        Authorization: `Bearer ${session.hiperbancoToken}`,
      },
    });
  }

  async generateStaticQrCode(
    dto: GenerateStaticQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeGenerateResponse> {
    const payload = {
      addressingKey: {
        type: dto.addressingKeyType,
        value: dto.addressingKeyValue,
      },
      amount: dto.amount,
      recipientName: dto.recipientName,
      conciliationId: dto.conciliationId,
      categoryCode: dto.categoryCode || '0000',
      location: {
        city: dto.locationCity,
        zipCode: dto.locationZipCode,
      },
    };

    return this.hiperbancoHttp.post<PixQrCodeGenerateResponse>(
      HiperbancoEndpoint.PIX_GENERATE_QRCODE_STATIC,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  async generateDynamicQrCode(
    dto: GenerateDynamicQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeGenerateResponse> {
    const payload = {
      addressingKey: {
        type: dto.addressingKeyType,
        value: dto.addressingKeyValue,
      },
      conciliationId: dto.conciliationId,
      singlePayment: dto.singlePayment,
      recipientName: dto.recipientName,
      expiresAt: dto.expiresAt,
      payer: {
        name: dto.payer.name,
        documentNumber: dto.payer.documentNumber,
        type: dto.payer.type,
        address: {
          addressLine: dto.payer.address.addressLine,
          state: dto.payer.address.state,
          city: dto.payer.address.city,
          zipCode: dto.payer.address.zipCode,
        },
      },
      changeAmountType: dto.changeAmountType,
      amount: dto.amount,
    };

    return this.hiperbancoHttp.post<PixQrCodeGenerateResponse>(
      HiperbancoEndpoint.PIX_GENERATE_QRCODE_DYNAMIC,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  async decodeQrCode(
    code: string,
    session: ProviderSession,
  ): Promise<PixQrCodeDecodeResponse> {
    const payload = { code };

    return this.hiperbancoHttp.post<PixQrCodeDecodeResponse>(
      HiperbancoEndpoint.PIX_DECODE_QRCODE,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  private buildRegisterPayload(
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
  ): Record<string, unknown> {
    const basePayload = {
      addressingKey: {
        type: dto.type,
        ...(dto.type !== PixKeyType.EVP && { value: dto.value }),
      },
      account: {
        type: PixAccountType.CHECKING,
        branch: accountBranch,
        number: accountNumber,
      },
    };

    if (dto.type === PixKeyType.EMAIL || dto.type === PixKeyType.PHONE) {
      return { ...basePayload, totpCode: dto.totpCode };
    }

    return basePayload;
  }
}
