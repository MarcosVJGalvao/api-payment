import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { AppLoggerService } from '@/common/logger/logger.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { BillPayment } from './entities/bill-payment.entity';
import { BillPaymentStatus } from './enums/bill-payment-status.enum';
import { ConfirmBillPaymentDto } from './dto/confirm-bill-payment.dto';
import { QueryBillPaymentDto } from './dto/query-bill-payment.dto';
import { BillPaymentProviderHelper } from './helpers/bill-payment-provider.helper';
import { BillPaymentSyncHelper } from './helpers/bill-payment-sync.helper';
import {
  BillPaymentValidateResponse,
  BillPaymentConfirmResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { FilterOperator } from '@/common/base-query/enums/filter-operator.enum';

@Injectable()
export class BillPaymentService {
  private readonly context = BillPaymentService.name;

  constructor(
    @InjectRepository(BillPayment)
    private readonly repository: Repository<BillPayment>,
    private readonly providerHelper: BillPaymentProviderHelper,
    private readonly syncHelper: BillPaymentSyncHelper,
    private readonly baseQueryService: BaseQueryService,
    private readonly logger: AppLoggerService,
  ) {}

  async validateBill(
    provider: FinancialProvider,
    digitable: string,
    session: ProviderSession,
  ): Promise<BillPaymentValidateResponse> {
    this.logger.log(
      `Validating bill payment with digitable: ${digitable.substring(0, 10)}...`,
      this.context,
    );

    try {
      const response = await this.providerHelper.validateBill(
        provider,
        digitable,
        session,
      );

      this.logger.log(
        `Bill payment validated successfully, id: ${response.id}`,
        this.context,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to validate bill payment: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      if (error instanceof CustomHttpException) {
        throw error;
      }

      throw new CustomHttpException(
        'Failed to validate bill payment',
        HttpStatus.BAD_REQUEST,
        ErrorCode.BILL_PAYMENT_VALIDATION_FAILED,
      );
    }
  }

  async confirmPayment(
    provider: FinancialProvider,
    dto: ConfirmBillPaymentDto,
    session: ProviderSession,
    clientId: string,
    accountId: string,
  ): Promise<BillPaymentConfirmResponse & { paymentId: string }> {
    this.logger.log(
      `Confirming bill payment with validation id: ${dto.id}`,
      this.context,
    );

    try {
      const response = await this.providerHelper.confirmPayment(
        provider,
        dto,
        session,
      );

      const payment = this.repository.create({
        status: BillPaymentStatus.CREATED,
        digitable: response.digitable || '',
        validationId: dto.id,
        authenticationCode: response.authenticationCode,
        transactionId: response.transactionId,
        originalAmount: dto.amount,
        amount: dto.amount,
        bankBranch: dto.bankBranch,
        bankAccount: dto.bankAccount,
        description: dto.description,
        settleDate: response.settleDate
          ? new Date(response.settleDate)
          : undefined,
        providerSlug: provider,
        clientId,
        accountId,
      });

      const savedPayment = await this.repository.save(payment);

      this.logger.log(
        `Bill payment confirmed and persisted, id: ${savedPayment.id}, authCode: ${response.authenticationCode}`,
        this.context,
      );

      return {
        ...response,
        paymentId: savedPayment.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to confirm bill payment: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );

      if (error instanceof CustomHttpException) {
        throw error;
      }

      throw new CustomHttpException(
        'Failed to confirm bill payment',
        HttpStatus.BAD_REQUEST,
        ErrorCode.BILL_PAYMENT_CONFIRMATION_FAILED,
      );
    }
  }

  async findById(
    id: string,
    clientId: string,
    accountId: string,
    session?: ProviderSession,
  ): Promise<BillPayment> {
    this.logger.log(`Finding bill payment by id: ${id}`, this.context);

    const payment = await this.repository.findOne({ where: { id } });

    if (!payment) {
      throw new CustomHttpException(
        `Bill payment not found: ${id}`,
        HttpStatus.NOT_FOUND,
        ErrorCode.BILL_PAYMENT_NOT_FOUND,
      );
    }

    if (payment.clientId !== clientId || payment.accountId !== accountId) {
      throw new CustomHttpException(
        'Bill payment does not belong to this account',
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCESS_DENIED,
      );
    }

    if (session) {
      return this.syncHelper.syncPaymentWithProvider(payment, session);
    }

    return payment;
  }

  async listPayments(
    query: QueryBillPaymentDto,
    clientId: string,
    accountId: string,
  ) {
    this.logger.log(
      `Listing bill payments for account ${accountId}`,
      this.context,
    );

    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.repository,
      query,
      {
        relations: ['recipient'],
        defaultSortBy: 'createdAt',
        searchFields: [
          'digitable',
          'assignor',
          'recipient.name',
          'description',
        ],
        dateField: 'createdAt',
        filters: [{ field: 'status' }],
      },
    );

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

    const result = await this.baseQueryService.findAll(
      this.repository,
      queryOptions,
    );

    return {
      ...result,
      data: result.data.map((payment) => instanceToPlain(payment)),
    };
  }
}
