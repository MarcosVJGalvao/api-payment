import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '@/common/logger/logger.service';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { Boleto } from './entities/boleto.entity';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { QueryBoletoDto } from './dto/query-boleto.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { BoletoProviderHelper } from './helpers/boleto-provider.helper';
import { BoletoSyncHelper } from './helpers/boleto-sync.helper';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { BoletoStatus } from './enums/boleto-status.enum';
import { parseDateOnly } from '@/common/helpers/date.helpers';
import {
  BoletoEmissionResponse,
  BoletoWebhookPayload,
  BoletoCancelResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import {
  validateBoletoDates,
  parseBoletoStatus,
} from './helpers/boleto-validation.helper';
import { FilterOperator } from '@/common/base-query/enums/filter-operator.enum';

@Injectable()
export class BoletoService {
  private readonly context = BoletoService.name;

  constructor(
    @InjectRepository(Boleto)
    private readonly repository: Repository<Boleto>,
    private readonly providerHelper: BoletoProviderHelper,
    private readonly syncHelper: BoletoSyncHelper,
    private readonly baseQueryService: BaseQueryService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Cria e emite um novo boleto no provedor financeiro especificado.
   * @param provider - Provedor financeiro
   * @param dto - Dados do boleto a ser criado
   * @param session - Sessão autenticada do provedor
   * @returns Resposta do provedor com dados do boleto emitido mais o campo internalId (ID gerado pelo banco de dados)
   * @throws CustomHttpException se validação falhar ou emissão falhar
   */
  async createBoleto(
    provider: FinancialProvider,
    dto: CreateBoletoDto,
    session: ProviderSession,
  ): Promise<BoletoEmissionResponse> {
    this.logger.log(`Creating boleto for provider: ${provider}`, this.context);

    // Valida regras de negócio relacionadas a datas
    validateBoletoDates(dto);

    try {
      // Emite o boleto no provedor
      const response: BoletoEmissionResponse =
        await this.providerHelper.emitBoleto(provider, dto, session);

      // Salva no banco de dados (para rastreamento interno, mas retorna a resposta do provedor)
      const boleto = this.repository.create({
        alias: dto.alias,
        type: dto.type,
        status: parseBoletoStatus(response.status),
        amount: dto.amount,
        dueDate: parseDateOnly(dto.dueDate),
        closePayment: dto.closePayment
          ? parseDateOnly(dto.closePayment)
          : undefined,
        documentNumber: dto.documentNumber,
        accountNumber: dto.account.number,
        accountBranch: dto.account.branch,
        payerDocument: dto.payer?.document,
        payerName: dto.payer?.name,
        payerTradeName: dto.payer?.tradeName,
        payerAddress: dto.payer?.address,
        interestStartDate: dto.interest?.startDate
          ? parseDateOnly(dto.interest.startDate)
          : undefined,
        interestValue: dto.interest?.value,
        interestType: dto.interest?.type,
        fineStartDate: dto.fine?.startDate
          ? parseDateOnly(dto.fine.startDate)
          : undefined,
        fineValue: dto.fine?.value,
        fineType: dto.fine?.type,
        ...(dto.discount && {
          discountLimitDate: parseDateOnly(dto.discount.limitDate),
          discountValue: dto.discount.value,
          discountType: dto.discount.type,
        }),
        authenticationCode: response.authenticationCode,
        barcode: response.barcode,
        digitable: response.digitable,
        providerSlug: provider,
        clientId: session.clientId,
        accountId: session.accountId,
      });

      const savedBoleto = await this.repository.save(boleto);
      this.logger.log(
        `Boleto saved to database: ${savedBoleto.id}`,
        this.context,
      );

      // Retorna a resposta do provedor adicionando o ID gerado pelo banco de dados
      return {
        ...response,
        internalId: savedBoleto.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create boleto: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      // Se já for uma CustomHttpException (tratada pelo handleHiperbancoError), apenas propaga
      if (error instanceof CustomHttpException) {
        throw error;
      }

      // Para erros inesperados não tratados, usar Internal Server Error
      throw new CustomHttpException(
        'Failed to emit boleto in financial provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.BOLETO_EMISSION_FAILED,
      );
    }
  }

  /**
   * Busca um boleto por ID.
   * @param id - ID do boleto
   * @param clientId - ID do cliente (para validação de isolamento)
   * @param accountId - ID da conta (para validação de isolamento)
   * @param session - Sessão do provedor (opcional, usada para buscar detalhes atualizados do Hiperbanco)
   * @returns Boleto encontrado
   * @throws CustomHttpException se o boleto não for encontrado ou não pertence à conta
   */
  async findById(
    id: string,
    clientId: string,
    accountId: string,
    session?: ProviderSession,
  ): Promise<Boleto> {
    this.logger.log(`Finding boleto by id: ${id}`, this.context);

    const boleto = await this.repository.findOne({ where: { id } });

    if (!boleto) {
      throw new CustomHttpException(
        `Boleto not found: ${id}`,
        HttpStatus.NOT_FOUND,
        ErrorCode.BOLETO_NOT_FOUND,
      );
    }

    if (boleto.clientId !== clientId || boleto.accountId !== accountId) {
      throw new CustomHttpException(
        'Boleto does not belong to this account',
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCESS_DENIED,
      );
    }

    if (session) {
      return this.syncHelper.syncBoletoWithProvider(boleto, session);
    }

    return boleto;
  }

  /**
   * Atualiza um boleto.
   * @param id - ID do boleto
   * @param dto - Dados para atualização
   * @param clientId - ID do cliente (para validação de isolamento)
   * @param accountId - ID da conta (para validação de isolamento)
   * @returns Boleto atualizado
   * @throws CustomHttpException se o boleto não for encontrado ou não pertence à conta
   */
  async updateBoleto(
    id: string,
    dto: UpdateBoletoDto,
    clientId: string,
    accountId: string,
  ): Promise<Boleto> {
    this.logger.log(`Updating boleto: ${id}`, this.context);

    const boleto = await this.findById(id, clientId, accountId);

    if (dto.status) {
      boleto.status = dto.status;
    }
    if (dto.authenticationCode) {
      boleto.authenticationCode = dto.authenticationCode;
    }
    if (dto.barcode) {
      boleto.barcode = dto.barcode;
    }
    if (dto.digitable) {
      boleto.digitable = dto.digitable;
    }

    const updatedBoleto = await this.repository.save(boleto);
    this.logger.log(`Boleto updated: ${id}`, this.context);

    return updatedBoleto;
  }

  /**
   * Lista boletos com paginação, filtros e busca.
   * @param query - Parâmetros de query
   * @param clientId - ID do cliente (para isolamento)
   * @param accountId - ID da conta (para isolamento - cada conta só vê seus próprios boletos)
   * @returns Resultado paginado de boletos
   */
  async listBoletos(
    query: QueryBoletoDto,
    clientId: string,
    accountId: string,
  ) {
    this.logger.log('Listing boletos', this.context);

    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.repository,
      query,
      {
        defaultSortBy: 'createdAt',
        searchFields: ['alias', 'documentNumber'],
        dateField: 'dueDate',
        filters: [
          { field: 'status' },
          { field: 'type' },
          { field: 'providerSlug' },
        ],
      },
    );

    // Adicionar filtros de isolamento manualmente (clientId e accountId são obrigatórios)
    queryOptions.filters = queryOptions.filters || [];
    queryOptions.filters.push(
      {
        field: 'clientId',
        operator: FilterOperator.EQUALS,
        value: clientId,
      },
      {
        field: 'accountId',
        operator: FilterOperator.EQUALS,
        value: accountId,
      },
    );

    return this.baseQueryService.findAll(this.repository, queryOptions);
  }

  /**
   * Cancela um boleto no provedor financeiro.
   * @param id - ID interno do boleto
   * @param provider - Provedor financeiro
   * @param session - Sessão autenticada do provedor
   * @returns Resposta do provedor confirmando o cancelamento
   * @throws CustomHttpException se o boleto não for encontrado, não pertence à conta ou não pode ser cancelado
   */
  async cancelBoleto(
    id: string,
    provider: FinancialProvider,
    session: ProviderSession,
  ): Promise<BoletoCancelResponse> {
    this.logger.log(`Cancelling boleto: ${id}`, this.context);

    // Valida que accountId está presente na sessão (obrigatório para operações de boleto)
    if (!session.accountId) {
      throw new CustomHttpException(
        'Account ID is required for boleto operations',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_SESSION,
      );
    }

    // Busca o boleto para validar existência e permissões
    const boleto = await this.findById(id, session.clientId, session.accountId);

    // Valida se o boleto pode ser cancelado (não pode se já estiver pago ou cancelado)
    const nonCancellableStatuses = [BoletoStatus.PAID, BoletoStatus.CANCELLED];
    if (nonCancellableStatuses.includes(boleto.status)) {
      throw new CustomHttpException(
        `Boleto cannot be cancelled with status: ${boleto.status}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.BOLETO_CANNOT_BE_CANCELLED,
      );
    }

    try {
      // Cancela o boleto no provedor (cada provider extrai os campos que precisa)
      const response = await this.providerHelper.cancelBoleto(
        provider,
        boleto,
        session,
      );

      // Atualiza o status no banco de dados
      boleto.status = BoletoStatus.CANCELLED;
      await this.repository.save(boleto);

      this.logger.log(`Boleto cancelled successfully: ${id}`, this.context);

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to cancel boleto: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      // Se já for uma CustomHttpException (tratada pelo handleHiperbancoError), apenas propaga
      if (error instanceof CustomHttpException) {
        throw error;
      }

      // Para erros inesperados não tratados, usar Internal Server Error
      throw new CustomHttpException(
        'Failed to cancel boleto in financial provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.BOLETO_CANCEL_FAILED,
      );
    }
  }

  /**
   * Processa atualização recebida via webhook.
   * @param payload - Payload recebido do webhook
   * @returns Boleto atualizado
   */
  async processWebhookUpdate(
    payload: BoletoWebhookPayload,
  ): Promise<Boleto | null> {
    this.logger.log(
      `Processing webhook update for boleto: ${payload.id || payload.authenticationCode}`,
      this.context,
    );

    try {
      // Identificar o boleto pelo authenticationCode, barcode ou digitable que são únicos
      // O provider envia esses campos no webhook que foram salvos na emissão
      let boleto: Boleto | null = null;

      if (payload.authenticationCode) {
        boleto = await this.repository.findOne({
          where: { authenticationCode: payload.authenticationCode },
        });
      } else if (payload.barcode) {
        boleto = await this.repository.findOne({
          where: { barcode: payload.barcode },
        });
      } else if (payload.digitable) {
        boleto = await this.repository.findOne({
          where: { digitable: payload.digitable },
        });
      }

      if (!boleto) {
        this.logger.warn(
          `Boleto not found for webhook payload: ${JSON.stringify(payload)}`,
          this.context,
        );
        return null;
      }

      // Atualiza campos recebidos
      if (payload.status) {
        boleto.status = parseBoletoStatus(payload.status);
      }
      if (payload.authenticationCode) {
        boleto.authenticationCode = payload.authenticationCode;
      }
      if (payload.barcode) {
        boleto.barcode = payload.barcode;
      }
      if (payload.digitable) {
        boleto.digitable = payload.digitable;
      }

      const updatedBoleto = await this.repository.save(boleto);
      this.logger.log(`Boleto updated via webhook: ${boleto.id}`, this.context);

      return updatedBoleto;
    } catch (error) {
      this.logger.error(
        `Failed to process webhook update: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
      // Não lança exceção para não fazer o Hiperbanco retentar
      return null;
    }
  }
}
