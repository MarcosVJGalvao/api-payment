import { Injectable, HttpStatus } from '@nestjs/common';
import { AppLoggerService } from '@/common/logger/logger.service';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { PixProviderHelper } from './helpers/pix-provider.helper';
import { AccountService } from '@/account/account.service';
import {
  PixGetKeysResponse,
  PixRegisterKeyResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { RegisterPixKeyDto } from './dto/register-pix-key.dto';
import { GenerateTotpDto } from './dto/generate-totp.dto';
import { PixKeyType } from './enums/pix-key-type.enum';

@Injectable()
export class PixService {
  private readonly context = PixService.name;

  constructor(
    private readonly providerHelper: PixProviderHelper,
    private readonly accountService: AccountService,
    private readonly logger: AppLoggerService,
  ) {}

  async getPixKeys(
    provider: FinancialProvider,
    accountId: string,
    session: ProviderSession,
  ): Promise<PixGetKeysResponse> {
    const account = await this.getAccountData(accountId);

    this.logger.log(
      `Querying PIX keys for account ${account.number}`,
      this.context,
    );

    try {
      const keys = await this.providerHelper.getPixKeys(
        provider,
        account.number,
        session,
      );

      this.logger.log(
        `Found ${keys.length} PIX keys for account ${account.number}`,
        this.context,
      );

      return keys;
    } catch (error) {
      this.logger.error(
        `Failed to query PIX keys for account ${account.number}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      if (error instanceof CustomHttpException) {
        throw error;
      }

      throw new CustomHttpException(
        'Failed to query PIX keys',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_KEY_QUERY_FAILED,
      );
    }
  }

  async registerPixKey(
    provider: FinancialProvider,
    dto: RegisterPixKeyDto,
    accountId: string,
    session: ProviderSession,
  ): Promise<PixRegisterKeyResponse> {
    const account = await this.getAccountData(accountId);

    // Validar TOTP para EMAIL e PHONE
    if (
      (dto.type === PixKeyType.EMAIL || dto.type === PixKeyType.PHONE) &&
      !dto.totpCode
    ) {
      throw new CustomHttpException(
        'TOTP code is required for EMAIL and PHONE key types',
        HttpStatus.BAD_REQUEST,
        ErrorCode.PIX_TOTP_REQUIRED,
      );
    }

    this.logger.log(
      `Registering PIX key type=${dto.type} for account ${account.number}`,
      this.context,
    );

    try {
      const result = await this.providerHelper.registerPixKey(
        provider,
        dto,
        account.branch,
        account.number,
        session,
      );

      this.logger.log(
        `PIX key registered successfully type=${dto.type} for account ${account.number}`,
        this.context,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to register PIX key type=${dto.type} for account ${account.number}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      if (error instanceof CustomHttpException) {
        throw error;
      }

      throw new CustomHttpException(
        'Failed to register PIX key',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_KEY_REGISTRATION_FAILED,
      );
    }
  }

  async deletePixKey(
    provider: FinancialProvider,
    addressKey: string,
    session: ProviderSession,
  ): Promise<void> {
    this.logger.log(`Deleting PIX key: ${addressKey}`, this.context);

    try {
      await this.providerHelper.deletePixKey(provider, addressKey, session);

      this.logger.log(
        `PIX key deleted successfully: ${addressKey}`,
        this.context,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete PIX key: ${addressKey}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      if (error instanceof CustomHttpException) {
        throw error;
      }

      throw new CustomHttpException(
        'Failed to delete PIX key',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_KEY_DELETE_FAILED,
      );
    }
  }

  async generateTotpCode(
    provider: FinancialProvider,
    dto: GenerateTotpDto,
    session: ProviderSession,
  ): Promise<void> {
    // Validar que o tipo é EMAIL ou PHONE
    if (dto.type !== PixKeyType.EMAIL && dto.type !== PixKeyType.PHONE) {
      throw new CustomHttpException(
        'TOTP generation is only available for EMAIL and PHONE key types',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }

    this.logger.log(
      `Generating TOTP code for ${dto.type}: ${dto.value}`,
      this.context,
    );

    try {
      await this.providerHelper.generateTotpCode(provider, dto, session);

      this.logger.log(
        `TOTP code generated and sent to ${dto.type}: ${dto.value}`,
        this.context,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate TOTP code for ${dto.type}: ${dto.value}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      if (error instanceof CustomHttpException) {
        throw error;
      }

      throw new CustomHttpException(
        'Failed to generate TOTP code',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_TOTP_GENERATION_FAILED,
      );
    }
  }

  /**
   * Obtém os dados da conta pelo ID.
   * @param accountId ID da conta.
   * @returns Dados da conta.
   */
  private async getAccountData(accountId: string) {
    const account = await this.accountService.findById(accountId);

    if (!account) {
      throw new CustomHttpException(
        'Account not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.ACCOUNT_NOT_FOUND,
      );
    }

    return account;
  }
}
