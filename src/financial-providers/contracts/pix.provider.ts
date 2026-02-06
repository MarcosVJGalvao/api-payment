import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from './provider-session';
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
import type { TransferPayload } from '@/pix/interfaces/transfer-payload.interface';

export interface PixProvider {
  readonly providerSlug: FinancialProvider;

  getPixKeys(
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixGetKeysResponse>;

  registerPixKey(
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixRegisterKeyResponse>;

  deletePixKey(addressKey: string, session: ProviderSession): Promise<void>;

  generateTotpCode(
    dto: GenerateTotpDto,
    session: ProviderSession,
  ): Promise<void>;

  validatePixKey(
    addressingKey: string,
    session: ProviderSession,
  ): Promise<PixValidateKeyResponse>;

  transfer(
    payload: TransferPayload,
    session: ProviderSession,
    idempotencyKey?: string,
  ): Promise<PixTransferResponse>;

  getTransferStatus(
    accountNumber: string,
    authenticationCode: string,
    session: ProviderSession,
  ): Promise<PixTransferStatusResponse>;

  generateStaticQrCode(
    dto: GenerateStaticQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeGenerateResponse>;

  generateDynamicQrCode(
    dto: GenerateDynamicQrCodeDto,
    session: ProviderSession,
  ): Promise<PixQrCodeGenerateResponse>;

  decodeQrCode(
    code: string,
    session: ProviderSession,
  ): Promise<PixQrCodeDecodeResponse>;
}
