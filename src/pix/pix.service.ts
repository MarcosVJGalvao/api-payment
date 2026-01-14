import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  PixValidateKeyResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { RegisterPixKeyDto } from './dto/register-pix-key.dto';
import { GenerateTotpDto } from './dto/generate-totp.dto';
import { PixTransferDto } from './dto/pix-transfer.dto';
import { PixKeyType } from './enums/pix-key-type.enum';
import { PixTransfer } from './entities/pix-transfer.entity';
import { PixTransferStatus } from './enums/pix-transfer-status.enum';
import { PixInitializationType } from './enums/pix-initialization-type.enum';
import { PixAccountType } from './enums/pix-account-type.enum';
import { PixTransactionType } from './enums/pix-transaction-type.enum';
import { OnboardingTypeAccount } from '@/onboarding/enums/onboarding-type-account.enum';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { mapPixTransferStatusToTransactionStatus } from '@/common/helpers/status-mapper.helper';

@Injectable()
export class PixService {
  private readonly context = PixService.name;

  constructor(
    private readonly providerHelper: PixProviderHelper,
    private readonly accountService: AccountService,
    private readonly logger: AppLoggerService,
    @InjectRepository(PixTransfer)
    private readonly pixTransferRepository: Repository<PixTransfer>,
    private readonly transactionService: TransactionService,
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
      if (error instanceof CustomHttpException) throw error;
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
        `PIX key registered successfully type=${dto.type}`,
        this.context,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to register PIX key type=${dto.type}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
      if (error instanceof CustomHttpException) throw error;
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
      if (error instanceof CustomHttpException) throw error;
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
      if (error instanceof CustomHttpException) throw error;
      throw new CustomHttpException(
        'Failed to generate TOTP code',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_TOTP_GENERATION_FAILED,
      );
    }
  }

  async validatePixKey(
    provider: FinancialProvider,
    addressingKey: string,
    session: ProviderSession,
  ): Promise<PixValidateKeyResponse> {
    this.logger.log(`Validating PIX key: ${addressingKey}`, this.context);

    try {
      const result = await this.providerHelper.validatePixKey(
        provider,
        addressingKey,
        session,
      );
      this.logger.log(
        `PIX key validated: endToEndId=${result.endToEndId}`,
        this.context,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to validate PIX key: ${addressingKey}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
      if (error instanceof CustomHttpException) throw error;
      throw new CustomHttpException(
        'Failed to validate PIX key',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_KEY_QUERY_FAILED,
      );
    }
  }

  async transfer(
    provider: FinancialProvider,
    dto: PixTransferDto,
    accountId: string,
    clientId: string,
    session: ProviderSession,
  ): Promise<PixTransfer> {
    const account = await this.getAccountData(accountId);
    const onboarding = account.onboarding;

    if (!onboarding) {
      throw new CustomHttpException(
        'Account onboarding not found',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
      );
    }

    const senderDocType =
      onboarding.typeAccount === OnboardingTypeAccount.PF ? 'CPF' : 'CNPJ';

    const payload = this.buildTransferPayload(dto, account, onboarding);

    this.logger.log(
      `Creating PIX transfer: type=${dto.initializationType} amount=${dto.amount}`,
      this.context,
    );

    // Criar registro no banco antes de chamar provider
    const pixTransfer = this.pixTransferRepository.create({
      status: PixTransferStatus.CREATED,
      amount: dto.amount,
      description: dto.description,
      initializationType: dto.initializationType,
      endToEndId: dto.endToEndId,
      pixKey: dto.pixKey,
      idempotencyKey: dto.idempotencyKey,
      senderDocumentType: senderDocType,
      senderDocumentNumber: onboarding.documentNumber,
      senderName: onboarding.registerName,
      senderAccountBranch: account.branch,
      senderAccountNumber: account.number,
      senderAccountType: PixAccountType.CHECKING,
      senderBankIspb: '13140088', // Hiperbanco ISPB
      providerSlug: provider,
      clientId,
      accountId,
    });

    await this.pixTransferRepository.save(pixTransfer);

    try {
      const response = await this.providerHelper.transfer(
        provider,
        payload,
        session,
        dto.idempotencyKey,
      );

      // Atualizar com dados do response
      pixTransfer.status =
        (response.status as PixTransferStatus) || PixTransferStatus.DONE;
      pixTransfer.transactionId = response.transactionId;
      pixTransfer.authenticationCode = response.authenticationCode;
      pixTransfer.correlationId = response.correlationId;
      pixTransfer.channel = response.channel;
      pixTransfer.type = this.mapTransactionType(response.type);
      pixTransfer.recipientDocumentType = response.recipient.documentType;
      pixTransfer.recipientDocumentNumber = response.recipient.documentNumber;
      pixTransfer.recipientName = response.recipient.name;
      pixTransfer.recipientAccountBranch = response.recipient.account.branch;
      pixTransfer.recipientAccountNumber = response.recipient.account.number;
      pixTransfer.recipientAccountType = response.recipient.account.type;
      pixTransfer.recipientBankIspb = response.recipient.bank.ispb;
      pixTransfer.recipientBankCompe = response.recipient.bank.compe;
      pixTransfer.recipientBankName = response.recipient.bank.name;

      await this.pixTransferRepository.save(pixTransfer);

      // Criar Transaction para o PIX transfer
      if (pixTransfer.authenticationCode) {
        await this.createTransactionForTransfer(
          pixTransfer,
          clientId,
          accountId,
        );
      }

      this.logger.log(
        `PIX transfer completed: id=${pixTransfer.id} transactionId=${response.transactionId}`,
        this.context,
      );

      return pixTransfer;
    } catch (error) {
      pixTransfer.status = PixTransferStatus.REPROVED;
      await this.pixTransferRepository.save(pixTransfer);

      this.logger.error(
        `PIX transfer failed: id=${pixTransfer.id}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      if (error instanceof CustomHttpException) throw error;
      throw new CustomHttpException(
        'Failed to process PIX transfer',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_TRANSFER_FAILED,
      );
    }
  }

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

  private buildTransferPayload(
    dto: PixTransferDto,
    account: { branch: string; number: string },
    onboarding: { documentNumber: string; registerName: string },
  ) {
    const basePayload = {
      sender: {
        account: {
          type: PixAccountType.CHECKING,
          branch: account.branch,
          number: account.number,
        },
        documentNumber: onboarding.documentNumber,
        name: onboarding.registerName,
      },
      amount: dto.amount,
      initializationType: dto.initializationType,
      paymentDate: dto.paymentDate || '',
    };

    if (dto.initializationType === PixInitializationType.MANUAL) {
      return {
        ...basePayload,
        transactionNotes: dto.description,
        recipient: {
          documentNumber: dto.recipient!.documentNumber,
          name: dto.recipient!.name,
          account: dto.recipient!.account,
          bank: dto.recipient!.bank,
        },
      };
    }

    const keyPayload = {
      ...basePayload,
      description: dto.description,
      endToEndId: dto.endToEndId,
      pixKey: dto.pixKey,
    };

    if (dto.initializationType === PixInitializationType.STATIC_QR_CODE) {
      return { ...keyPayload, conciliationId: dto.conciliationId };
    }

    if (dto.initializationType === PixInitializationType.DYNAMIC_QR_CODE) {
      return {
        ...keyPayload,
        receiverReconciliationId: dto.receiverReconciliationId,
      };
    }

    return keyPayload;
  }

  private mapTransactionType(type?: string): PixTransactionType | undefined {
    if (!type) return undefined;
    if (type === 'CASH_OUT') return PixTransactionType.DEBIT;
    if (type === 'CASH_IN') return PixTransactionType.CREDIT;
    return undefined;
  }

  /**
   * Cria uma Transaction para o PIX transfer.
   */
  private async createTransactionForTransfer(
    pixTransfer: PixTransfer,
    clientId: string,
    accountId: string,
  ): Promise<void> {
    try {
      const existingTx = await this.transactionService.findByAuthenticationCode(
        pixTransfer.authenticationCode!,
      );

      if (!existingTx) {
        await this.transactionService.createFromWebhook({
          authenticationCode: pixTransfer.authenticationCode!,
          type: TransactionType.PIX_CASH_OUT,
          status: mapPixTransferStatusToTransactionStatus(pixTransfer.status),
          amount: pixTransfer.amount,
          clientId,
          accountId,
          pixTransferId: pixTransfer.id,
        });

        this.logger.log(
          `Transaction created for PIX transfer: ${pixTransfer.id}`,
          this.context,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create transaction for PIX transfer: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
    }
  }
}
