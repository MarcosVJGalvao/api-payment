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
  PixQrCodeDecodeResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { RegisterPixKeyDto } from './dto/register-pix-key.dto';
import { GenerateTotpDto } from './dto/generate-totp.dto';
import { PixTransferDto } from './dto/pix-transfer.dto';
import { GenerateStaticQrCodeDto } from './dto/generate-static-qr-code.dto';
import { GenerateDynamicQrCodeDto } from './dto/generate-dynamic-qr-code.dto';
import { PixKeyType } from './enums/pix-key-type.enum';
import { PixTransfer } from './entities/pix-transfer.entity';
import { PixQrCode } from './entities/pix-qr-code.entity';
import { PixTransferStatus } from './enums/pix-transfer-status.enum';
import { PixQrCodeType } from './enums/pix-qr-code-type.enum';
import { PixQrCodeStatus } from './enums/pix-qr-code-status.enum';
import { PixAccountType } from './enums/pix-account-type.enum';
import { OnboardingTypeAccount } from '@/onboarding/enums/onboarding-type-account.enum';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { mapPixTransferStatusToTransactionStatus } from '@/common/helpers/status-mapper.helper';
import {
  buildTransferPayload,
  mapTransactionType,
  mapPixTransferStatus,
} from './helpers/pix-transfer.helper';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { parseDate } from '@/common/helpers/date.helpers';

@Injectable()
export class PixService {
  private readonly context = PixService.name;

  constructor(
    private readonly providerHelper: PixProviderHelper,
    private readonly accountService: AccountService,
    private readonly logger: AppLoggerService,
    @InjectRepository(PixTransfer)
    private readonly pixTransferRepository: Repository<PixTransfer>,
    @InjectRepository(PixQrCode)
    private readonly pixQrCodeRepository: Repository<PixQrCode>,
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
        ErrorCode.ACCOUNT_NOT_FOUND,
      );
    }

    const senderDocType =
      onboarding.typeAccount === OnboardingTypeAccount.PF ? 'CPF' : 'CNPJ';

    const payload = buildTransferPayload(dto, account, onboarding);

    this.logger.log(
      `Creating PIX transfer: type=${dto.initializationType} amount=${dto.amount}`,
      this.context,
    );

    const pixTransfer = this.pixTransferRepository.create({
      status: PixTransferStatus.CREATED,
      amount: dto.amount,
      description: dto.description,
      initializationType: dto.initializationType,
      endToEndId: dto.endToEndId,
      pixKey: dto.pixKey,
      idempotencyKey: dto.idempotencyKey,
      providerSlug: provider,
      clientId,
      accountId,
      sender: {
        documentType: senderDocType,
        documentNumber: onboarding.documentNumber,
        name: onboarding.registerName,
        accountBranch: account.branch,
        accountNumber: account.number,
        accountType: PixAccountType.CHECKING,
        bankIspb: '13140088', // Hiperbanco ISPB
      },
    });

    await this.pixTransferRepository.save(pixTransfer);

    try {
      const response = await this.providerHelper.transfer(
        provider,
        payload,
        session,
        dto.idempotencyKey,
      );

      pixTransfer.status = mapPixTransferStatus(
        response.status,
        PixTransferStatus.CREATED,
      );
      pixTransfer.transactionId = response.transactionId;
      pixTransfer.authenticationCode = response.authenticationCode;
      pixTransfer.correlationId = response.correlationId;
      pixTransfer.channel = response.channel;
      pixTransfer.type = mapTransactionType(response.type);

      const recipient = new PaymentRecipient();
      recipient.documentType = response.recipient.documentType;
      recipient.documentNumber = response.recipient.documentNumber;
      recipient.name = response.recipient.name;
      recipient.accountBranch = response.recipient.account.branch;
      recipient.accountNumber = response.recipient.account.number;
      recipient.accountType = response.recipient.account.type;
      recipient.bankIspb = response.recipient.bank.ispb;
      recipient.bankCompe = response.recipient.bank.compe;
      recipient.bankName = response.recipient.bank.name;
      pixTransfer.recipient = recipient;

      await this.pixTransferRepository.save(pixTransfer);

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

  async generateStaticQrCode(
    provider: FinancialProvider,
    dto: GenerateStaticQrCodeDto,
    accountId: string,
    clientId: string,
    session: ProviderSession,
  ): Promise<PixQrCode> {
    this.logger.log(
      `Generating static QR Code for account ${accountId}`,
      this.context,
    );

    try {
      const response = await this.providerHelper.generateStaticQrCode(
        provider,
        dto,
        session,
      );

      const pixQrCode = this.pixQrCodeRepository.create({
        encodedValue: response.encodedValue,
        type: PixQrCodeType.STATIC,
        status: PixQrCodeStatus.CREATED,
        amount: dto.amount || 0,
        addressingKeyType: dto.addressingKeyType,
        addressingKeyValue: dto.addressingKeyValue,
        recipientName: dto.recipientName,
        conciliationId: dto.conciliationId,
        categoryCode: dto.categoryCode || '0000',
        locationCity: dto.locationCity,
        locationZipCode: dto.locationZipCode,
        singlePayment: false,
        providerSlug: provider,
        clientId,
        accountId,
      });

      await this.pixQrCodeRepository.save(pixQrCode);

      this.logger.log(
        `Static QR Code generated: id=${pixQrCode.id}`,
        this.context,
      );

      return pixQrCode;
    } catch (error) {
      this.logger.error(
        `Failed to generate static QR Code`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
      if (error instanceof CustomHttpException) throw error;
      throw new CustomHttpException(
        'Failed to generate static QR Code',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_QRCODE_GENERATION_FAILED,
      );
    }
  }

  async generateDynamicQrCode(
    provider: FinancialProvider,
    dto: GenerateDynamicQrCodeDto,
    accountId: string,
    clientId: string,
    session: ProviderSession,
  ): Promise<PixQrCode> {
    this.logger.log(
      `Generating dynamic QR Code for account ${accountId}`,
      this.context,
    );

    try {
      const response = await this.providerHelper.generateDynamicQrCode(
        provider,
        dto,
        session,
      );

      // Criar entidade de pagador
      const payer = new PaymentSender();
      payer.name = dto.payer.name;
      payer.documentNumber = dto.payer.documentNumber;
      payer.type = dto.payer.type;

      const pixQrCode = this.pixQrCodeRepository.create({
        encodedValue: response.encodedValue,
        type: PixQrCodeType.DYNAMIC,
        status: PixQrCodeStatus.CREATED,
        amount: dto.amount || 0,
        addressingKeyType: dto.addressingKeyType,
        addressingKeyValue: dto.addressingKeyValue,
        recipientName: dto.recipientName,
        conciliationId: dto.conciliationId,
        singlePayment: dto.singlePayment || false,
        expiresAt: dto.expiresAt ? parseDate(dto.expiresAt) : undefined,
        changeAmountType: dto.changeAmountType,
        payer,
        providerSlug: provider,
        clientId,
        accountId,
      });

      await this.pixQrCodeRepository.save(pixQrCode);

      this.logger.log(
        `Dynamic QR Code generated: id=${pixQrCode.id}`,
        this.context,
      );

      return pixQrCode;
    } catch (error) {
      this.logger.error(
        `Failed to generate dynamic QR Code`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
      if (error instanceof CustomHttpException) throw error;
      throw new CustomHttpException(
        'Failed to generate dynamic QR Code',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_QRCODE_GENERATION_FAILED,
      );
    }
  }

  async decodeQrCode(
    provider: FinancialProvider,
    code: string,
    session: ProviderSession,
  ): Promise<PixQrCodeDecodeResponse> {
    this.logger.log(`Decoding QR Code via provider`, this.context);

    try {
      const result = await this.providerHelper.decodeQrCode(
        provider,
        code,
        session,
      );
      this.logger.log(
        `QR Code decoded: endToEndId=${result.endToEndId}`,
        this.context,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to decode QR Code`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
      if (error instanceof CustomHttpException) throw error;
      throw new CustomHttpException(
        'Failed to decode QR Code',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.PIX_QRCODE_DECODE_FAILED,
      );
    }
  }

  /**
   * Decodifica o Base64 do QR Code para EMV (Pix Copia e Cola).
   */
  decodeBase64QrCode(encodedValue: string): { emvCode: string } {
    try {
      const decodedBuffer = Buffer.from(encodedValue, 'base64');
      const emvCode = decodedBuffer.toString('utf-8');

      this.logger.log(`Base64 QR Code decoded to EMV`, this.context);

      return { emvCode };
    } catch (error) {
      this.logger.error(
        `Failed to decode Base64 QR Code`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
      throw new CustomHttpException(
        'Invalid Base64 encoded value',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_INPUT,
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
