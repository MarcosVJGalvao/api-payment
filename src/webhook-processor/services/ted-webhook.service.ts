import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { TedTransfer } from '@/ted/entities/ted-transfer.entity';
import { TedCashIn } from '@/ted/entities/ted-cash-in.entity';
import { TedRefund } from '@/ted/entities/ted-refund.entity';
import { TedTransferStatus } from '@/ted/enums/ted-transfer-status.enum';
import { TedCashInStatus } from '@/ted/enums/ted-cash-in-status.enum';
import { TedRefundStatus } from '@/ted/enums/ted-refund-status.enum';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { AccountService } from '@/account/account.service';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import {
  TedCashOutData,
  TedCashInData,
  TedRefundData,
} from '../interfaces/ted-webhook.interface';
import { mapWebhookEventToTransactionStatus } from '../helpers/transaction-status-mapper.helper';
import { canProcessWebhook } from '../helpers/webhook-state-machine.helper';
import { WebhookEventLogService } from './webhook-event-log.service';
import { WebhookEvent } from '../enums/webhook-event.enum';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';

@Injectable()
export class TedWebhookService {
  private readonly logger = new Logger(TedWebhookService.name);

  constructor(
    @InjectRepository(TedTransfer)
    private readonly tedTransferRepository: Repository<TedTransfer>,
    @InjectRepository(TedCashIn)
    private readonly tedCashInRepository: Repository<TedCashIn>,
    @InjectRepository(TedRefund)
    private readonly tedRefundRepository: Repository<TedRefund>,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
    private readonly webhookEventLogService: WebhookEventLogService,
    private readonly entityManager: EntityManager,
  ) {}

  // ============ Cash-Out Event Handlers ============

  /**
   * Processa TED_CASH_OUT_WAS_APPROVED
   */
  async handleCashOutApproved(
    events: WebhookPayload<TedCashOutData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    await this.processCashOutEvent(
      events,
      TedTransferStatus.APPROVED,
      WebhookEvent.TED_CASH_OUT_WAS_APPROVED,
      clientId,
      validPublicKey,
    );
  }

  /**
   * Processa TED_CASH_OUT_WAS_DONE
   */
  async handleCashOutDone(
    events: WebhookPayload<TedCashOutData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    await this.processCashOutEvent(
      events,
      TedTransferStatus.DONE,
      WebhookEvent.TED_CASH_OUT_WAS_DONE,
      clientId,
      validPublicKey,
    );
  }

  /**
   * Processa TED_CASH_OUT_WAS_CANCELED
   */
  async handleCashOutCanceled(
    events: WebhookPayload<TedCashOutData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    await this.processCashOutEvent(
      events,
      TedTransferStatus.CANCELED,
      WebhookEvent.TED_CASH_OUT_WAS_CANCELED,
      clientId,
      validPublicKey,
    );
  }

  /**
   * Processa TED_CASH_OUT_WAS_REPROVED
   */
  async handleCashOutReproved(
    events: WebhookPayload<TedCashOutData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    await this.processCashOutEvent(
      events,
      TedTransferStatus.REPROVED,
      WebhookEvent.TED_CASH_OUT_WAS_REPROVED,
      clientId,
      validPublicKey,
    );
  }

  /**
   * Processa TED_CASH_OUT_WAS_UNDONE
   */
  async handleCashOutUndone(
    events: WebhookPayload<TedCashOutData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    await this.processCashOutEvent(
      events,
      TedTransferStatus.UNDONE,
      WebhookEvent.TED_CASH_OUT_WAS_UNDONE,
      clientId,
      validPublicKey,
    );
  }

  private async processCashOutEvent(
    events: WebhookPayload<TedCashOutData>[],
    status: TedTransferStatus,
    eventName: WebhookEvent,
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn(`${eventName}: Invalid publicKey, skipping`);
      return;
    }

    for (const event of events) {
      const data = event.data;

      const tedTransfer = await this.tedTransferRepository.findOne({
        where: { authenticationCode: data.authenticationCode },
      });

      if (!tedTransfer) {
        this.logger.warn(
          `TedTransfer not found: ${data.authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          data.authenticationCode,
          String(eventName),
        );
      }

      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(lastEvent, eventName);

      if (!validation.canProcess) {
        this.logger.warn(
          `${eventName}: Out of sequence - ${validation.reason} - will retry`,
          { authenticationCode: data.authenticationCode },
        );
        throw new WebhookOutOfSequenceRetryableException(
          data.authenticationCode,
          String(eventName),
          validation.reason || 'Unknown reason',
        );
      }

      tedTransfer.status = status;
      tedTransfer.paymentDate = data.paymentDate
        ? new Date(data.paymentDate)
        : undefined;
      tedTransfer.refusalReason = data.refusalReason;

      await this.tedTransferRepository.save(tedTransfer);

      await this.transactionService.updateFromWebhook({
        authenticationCode: data.authenticationCode,
        status: mapWebhookEventToTransactionStatus(eventName),
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        description: data.description,
        providerTimestamp: new Date(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'TED_TRANSFER',
        entityId: tedTransfer.id,
        eventName,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(`${eventName} processed: ${data.authenticationCode}`);
    }
  }

  // ============ Cash-In Event Handlers ============

  /**
   * Processa TED_CASH_IN_WAS_RECEIVED
   */
  async handleCashInReceived(
    events: WebhookPayload<TedCashInData>[],
    _clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('TED_CASH_IN_WAS_RECEIVED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const existing = await this.tedCashInRepository.findOne({
        where: { authenticationCode: data.authenticationCode },
      });

      if (existing) {
        this.logger.log(`TedCashIn already exists: ${data.authenticationCode}`);
        continue;
      }

      const recipientAccountNumber = data.recipient?.account?.number;
      if (!recipientAccountNumber) {
        this.logger.warn(
          `TED_CASH_IN_WAS_RECEIVED: No recipient account number: ${data.authenticationCode}`,
        );
        continue;
      }

      const account = await this.accountService.findByNumber(
        recipientAccountNumber,
      );
      if (!account) {
        this.logger.warn(
          `TED_CASH_IN_WAS_RECEIVED: Account not found for number ${recipientAccountNumber}`,
        );
        continue;
      }

      const clientId = account.clientId;
      const accountId = account.id;

      const tedCashIn = this.tedCashInRepository.create({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        status: TedCashInStatus.RECEIVED,
        providerSlug: FinancialProvider.HIPERBANCO,
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        channel: data.channel,
        sender: {
          documentNumber: data.sender?.document,
          name: data.sender?.name,
          accountBranch: data.sender?.account?.branch,
          accountNumber: data.sender?.account?.number,
          bankIspb: data.sender?.account?.bank?.ispb,
          bankName: data.sender?.account?.bank?.name,
          bankCompe: data.sender?.account?.bank?.compe,
        },
        recipient: {
          documentNumber: data.recipient?.document,
          name: data.recipient?.name,
          accountBranch: data.recipient?.account?.branch,
          accountNumber: data.recipient?.account?.number,
        },
        clientId,
        accountId,
        providerCreatedAt: data.createdAt
          ? new Date(data.createdAt)
          : undefined,
      });

      const saved = await this.tedCashInRepository.save(tedCashIn);

      await this.transactionService.createFromWebhook({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        type: TransactionType.TED_IN,
        status: mapWebhookEventToTransactionStatus(
          WebhookEvent.TED_CASH_IN_WAS_RECEIVED,
        ),
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        clientId,
        accountId,
        tedCashInId: saved.id,
        providerTimestamp: new Date(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'TED_CASH_IN',
        entityId: saved.id,
        eventName: WebhookEvent.TED_CASH_IN_WAS_RECEIVED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `TED_CASH_IN_WAS_RECEIVED processed: ${data.authenticationCode}`,
      );
    }
  }

  /**
   * Processa TED_CASH_IN_WAS_CLEARED
   */
  async handleCashInCleared(
    events: WebhookPayload<TedCashInData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('TED_CASH_IN_WAS_CLEARED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;
      const authenticationCode = data.authenticationCode || event.entityId;

      if (!authenticationCode) {
        this.logger.warn(
          'TED_CASH_IN_WAS_CLEARED: No authenticationCode available',
        );
        continue;
      }

      const tedCashIn = await this.tedCashInRepository.findOne({
        where: { authenticationCode },
      });

      if (!tedCashIn) {
        this.logger.warn(
          `TedCashIn not found for CLEARED: ${authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          authenticationCode,
          'TED_CASH_IN_WAS_CLEARED',
        );
      }

      const lastEvent =
        await this.webhookEventLogService.getLastProcessedEvent(
          authenticationCode,
        );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.TED_CASH_IN_WAS_CLEARED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `TED_CASH_IN_WAS_CLEARED: Out of sequence - ${validation.reason}`,
          { authenticationCode },
        );
        throw new WebhookOutOfSequenceRetryableException(
          authenticationCode,
          'TED_CASH_IN_WAS_CLEARED',
          validation.reason || 'Unknown reason',
        );
      }

      tedCashIn.status = TedCashInStatus.CLEARED;
      await this.tedCashInRepository.save(tedCashIn);

      await this.transactionService.updateFromWebhook({
        authenticationCode,
        status: mapWebhookEventToTransactionStatus(
          WebhookEvent.TED_CASH_IN_WAS_CLEARED,
        ),
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        description: data.description,
        providerTimestamp: new Date(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode,
        entityType: 'TED_CASH_IN',
        entityId: tedCashIn.id,
        eventName: WebhookEvent.TED_CASH_IN_WAS_CLEARED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `TED_CASH_IN_WAS_CLEARED processed: ${authenticationCode}`,
      );
    }
  }

  // ============ Refund Event Handlers ============

  /**
   * Processa TED_REFUND_WAS_RECEIVED
   */
  async handleRefundReceived(
    events: WebhookPayload<TedRefundData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('TED_REFUND_WAS_RECEIVED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const existing = await this.tedRefundRepository.findOne({
        where: { authenticationCode: data.authenticationCode },
      });

      if (existing) {
        this.logger.log(`TedRefund already exists: ${data.authenticationCode}`);
        continue;
      }

      let relatedTedTransferId: string | undefined;
      let relatedTedCashInId: string | undefined;

      if (data.originalAuthenticationCode) {
        const transfer = await this.tedTransferRepository.findOne({
          where: { authenticationCode: data.originalAuthenticationCode },
        });
        if (transfer) relatedTedTransferId = transfer.id;

        const cashIn = await this.tedCashInRepository.findOne({
          where: { authenticationCode: data.originalAuthenticationCode },
        });
        if (cashIn) relatedTedCashInId = cashIn.id;
      }

      const tedRefund = this.tedRefundRepository.create({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        status: TedRefundStatus.RECEIVED,
        providerSlug: FinancialProvider.HIPERBANCO,
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        originalAuthenticationCode: data.originalAuthenticationCode,
        refundReason: data.refundReason,
        errorCode: data.errorCode,
        errorReason: data.errorReason,
        relatedTedTransferId,
        relatedTedCashInId,
        sender: {
          documentNumber: data.sender?.document,
          name: data.sender?.name,
        },
        recipient: {
          documentNumber: data.recipient?.document,
          name: data.recipient?.name,
        },
        clientId,
        providerCreatedAt: data.createdAt
          ? new Date(data.createdAt)
          : undefined,
      });

      const saved = await this.tedRefundRepository.save(tedRefund);

      await this.transactionService.createFromWebhook({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        type: TransactionType.TED_IN, // Refund is money coming back
        status: mapWebhookEventToTransactionStatus(
          WebhookEvent.TED_REFUND_WAS_RECEIVED,
        ),
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        clientId,
        tedRefundId: saved.id,
        providerTimestamp: new Date(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'TED_REFUND',
        entityId: saved.id,
        eventName: WebhookEvent.TED_REFUND_WAS_RECEIVED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `TED_REFUND_WAS_RECEIVED processed: ${data.authenticationCode}`,
      );
    }
  }

  /**
   * Processa TED_REFUND_WAS_CLEARED
   */
  async handleRefundCleared(
    events: WebhookPayload<TedRefundData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('TED_REFUND_WAS_CLEARED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;
      const authenticationCode = data.authenticationCode || event.entityId;

      if (!authenticationCode) {
        this.logger.warn(
          'TED_REFUND_WAS_CLEARED: No authenticationCode available',
        );
        continue;
      }

      const tedRefund = await this.tedRefundRepository.findOne({
        where: { authenticationCode },
      });

      if (!tedRefund) {
        this.logger.warn(
          `TedRefund not found for CLEARED: ${authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          authenticationCode,
          'TED_REFUND_WAS_CLEARED',
        );
      }

      const lastEvent =
        await this.webhookEventLogService.getLastProcessedEvent(
          authenticationCode,
        );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.TED_REFUND_WAS_CLEARED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `TED_REFUND_WAS_CLEARED: Out of sequence - ${validation.reason}`,
          { authenticationCode },
        );
        throw new WebhookOutOfSequenceRetryableException(
          authenticationCode,
          'TED_REFUND_WAS_CLEARED',
          validation.reason || 'Unknown reason',
        );
      }

      tedRefund.status = TedRefundStatus.CLEARED;
      await this.tedRefundRepository.save(tedRefund);

      await this.transactionService.updateFromWebhook({
        authenticationCode,
        status: mapWebhookEventToTransactionStatus(
          WebhookEvent.TED_REFUND_WAS_CLEARED,
        ),
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        description: data.description,
        providerTimestamp: new Date(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode,
        entityType: 'TED_REFUND',
        entityId: tedRefund.id,
        eventName: WebhookEvent.TED_REFUND_WAS_CLEARED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `TED_REFUND_WAS_CLEARED processed: ${authenticationCode}`,
      );
    }
  }
}
