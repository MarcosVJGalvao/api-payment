import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TedTransfer } from './entities/ted-transfer.entity';
import { TedTransferStatus } from './enums/ted-transfer-status.enum';
import { CreateTedDto } from './dto/create-ted.dto';
import { Account } from '@/account/entities/account.entity';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { TedProviderHelper } from './helpers/ted-provider.helper';
import { PaymentSender } from '@/common/entities/payment-sender.entity';
import { PaymentRecipient } from '@/common/entities/payment-recipient.entity';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { ITedTransferRequest } from './interfaces/ted-transfer-request.interface';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { mapTedTransferStatusToTransactionStatus } from '@/common/helpers/status-mapper.helper';

@Injectable()
export class TedService {
  private readonly logger = new Logger(TedService.name);

  constructor(
    @InjectRepository(TedTransfer)
    private readonly tedTransferRepository: Repository<TedTransfer>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly transactionService: TransactionService,
    private readonly providerHelper: TedProviderHelper,
    private readonly baseQueryService: BaseQueryService,
  ) {}

  /**
   * Lista transferências TED do banco de dados.
   */
  async findAll(
    queryDto: Record<string, unknown>,
    accountId: string,
  ): Promise<PaginationResult<TedTransfer>> {
    // Add accountId filter to query
    const queryWithAccount = { ...queryDto, accountId };

    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.tedTransferRepository,
      queryWithAccount as Parameters<
        typeof this.baseQueryService.buildQueryOptions
      >[1],
      {
        relations: ['sender', 'recipient'],
        defaultSortBy: 'createdAt',
        searchFields: ['description', 'authenticationCode'],
        dateField: 'createdAt',
        filters: [
          { field: 'status' },
          { field: 'providerSlug' },
          { field: 'accountId' },
        ],
      },
    );

    return this.baseQueryService.findAll(
      this.tedTransferRepository,
      queryOptions,
    );
  }

  /**
   * Busca uma transferência TED por ID no banco de dados.
   */
  async findOne(id: string, accountId: string): Promise<TedTransfer> {
    const tedTransfer = await this.tedTransferRepository.findOne({
      where: { id, accountId },
      relations: ['sender', 'recipient'],
    });

    if (!tedTransfer) {
      throw new CustomHttpException(
        'TED Transfer not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    return tedTransfer;
  }

  /**
   * Cria uma nova transferência TED.
   */
  async createTransfer(
    provider: FinancialProvider,
    createTedDto: CreateTedDto,
    clientId: string,
    accountId: string,
    session: ProviderSession,
  ): Promise<{ authenticationCode: string; transactionId: string }> {
    this.logger.log(
      `Starting TED transfer for client ${clientId} on account ${accountId}`,
    );

    // Buscar conta com onboarding para obter dados do sender
    const account = await this.accountRepository.findOne({
      where: { id: accountId, clientId },
      relations: ['onboarding'],
    });

    if (!account) {
      throw new CustomHttpException(
        'Sender account not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    const onboarding = account.onboarding;

    if (!onboarding) {
      throw new CustomHttpException(
        'Account onboarding not found',
        HttpStatus.BAD_REQUEST,
        ErrorCode.ACCOUNT_NOT_FOUND,
      );
    }

    // 1. Criar PaymentSender a partir dos dados do onboarding da conta
    const sender = new PaymentSender();
    sender.documentNumber = onboarding.documentNumber;
    sender.name = onboarding.registerName;
    sender.accountBranch = account.branch;
    sender.accountNumber = account.number;

    const recipient = new PaymentRecipient();
    recipient.documentNumber = createTedDto.recipient.document;
    recipient.name = createTedDto.recipient.name;
    recipient.bankCompe = createTedDto.recipient.bankCode;
    recipient.accountBranch = createTedDto.recipient.branch;
    recipient.accountNumber = createTedDto.recipient.account;
    recipient.accountType = createTedDto.recipient.accountType;

    // 2. Criar registro de TedTransfer (CREATED)
    const tedTransfer = this.tedTransferRepository.create({
      amount: createTedDto.amount,
      description: createTedDto.description,
      status: TedTransferStatus.CREATED,
      clientId: clientId,
      accountId: accountId,
      providerSlug: provider,
      idempotencyKey: createTedDto.idempotencyKey,
      sender: sender,
      recipient: recipient,
    });

    await this.tedTransferRepository.save(tedTransfer);

    try {
      // 3. Montar objeto para enviar ao provedor
      const transferRequest: ITedTransferRequest = {
        amount: createTedDto.amount,
        description: createTedDto.description,
        idempotencyKey: createTedDto.idempotencyKey,
        sender: {
          document: onboarding.documentNumber,
          name: onboarding.registerName,
          branch: account.branch,
          account: account.number,
        },
        recipient: createTedDto.recipient,
      };

      // 4. Chamar provedor usando o Helper Genérico
      const providerResponse = await this.providerHelper.createTransfer(
        provider,
        transferRequest,
        session,
      );

      // 5. Atualizar registro com dados do provedor
      tedTransfer.authenticationCode = providerResponse.authenticationCode;
      tedTransfer.providerTransactionId = providerResponse.transactionId;
      await this.tedTransferRepository.save(tedTransfer);

      // 6. Criar Transação (CREATED)
      await this.transactionService.createFromWebhook({
        authenticationCode: providerResponse.authenticationCode,
        type: TransactionType.TED_OUT,
        status: mapTedTransferStatusToTransactionStatus(tedTransfer.status),
        amount: createTedDto.amount,
        description: createTedDto.description,
        clientId: clientId,
        accountId: accountId,
        tedTransferId: tedTransfer.id,
      });

      return {
        authenticationCode: providerResponse.authenticationCode,
        transactionId: providerResponse.transactionId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to execute TED at provider: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Marcar como falha se der erro na chamada
      tedTransfer.status = TedTransferStatus.FAILED;
      await this.tedTransferRepository.save(tedTransfer);

      throw error;
    }
  }
}
