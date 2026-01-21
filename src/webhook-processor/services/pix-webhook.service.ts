import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixRefund, PixRefundStatus } from '@/pix/entities/pix-refund.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixQrCode } from '@/pix/entities/pix-qr-code.entity';
import { PixTransferStatus } from '@/pix/enums/pix-transfer-status.enum';
import { PixCashInStatus } from '@/pix/enums/pix-cash-in-status.enum';
import { PixQrCodeType } from '@/pix/enums/pix-qr-code-type.enum';
import { PixQrCodeStatus } from '@/pix/enums/pix-qr-code-status.enum';
import { PixInitializationType } from '@/pix/enums/pix-initialization-type.enum';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { AccountService } from '@/account/account.service';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import {
  PixCashInReceivedData,
  PixCashInClearedData,
  PixCashOutData,
  PixRefundData,
  PixQrCodeCreatedData,
} from '../interfaces/pix-webhook.interface';
import { mapWebhookEventToTransactionStatus } from '../helpers/transaction-status-mapper.helper';
import { canProcessWebhook } from '../helpers/webhook-state-machine.helper';
import { WebhookEventLogService } from './webhook-event-log.service';
import { WebhookEvent } from '../enums/webhook-event.enum';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';
import { parseDate } from '@/common/helpers/date.helpers';

@Injectable()
export class PixWebhookService {
  private readonly logger = new Logger(PixWebhookService.name);

  constructor(
    @InjectRepository(PixCashIn)
    private readonly pixCashInRepository: Repository<PixCashIn>,
    @InjectRepository(PixRefund)
    private readonly pixRefundRepository: Repository<PixRefund>,
    @InjectRepository(PixTransfer)
    private readonly pixTransferRepository: Repository<PixTransfer>,
    @InjectRepository(PixQrCode)
    private readonly pixQrCodeRepository: Repository<PixQrCode>,
    private readonly transactionService: TransactionService,
    private readonly webhookEventLogService: WebhookEventLogService,
    private readonly accountService: AccountService,
  ) {}

  async handleCashInReceived(
    events: WebhookPayload<PixCashInReceivedData>[],
    _clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('PIX_CASH_IN_WAS_RECEIVED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const existing = await this.pixCashInRepository.findOne({
        where: { authenticationCode: data.authenticationCode },
      });

      if (existing) {
        this.logger.log(`PixCashIn already exists: ${data.authenticationCode}`);
        continue;
      }

      // Find account by recipient.account.number to get clientId and accountId
      const recipientAccountNumber = data.recipient?.account?.number;
      if (!recipientAccountNumber) {
        this.logger.warn(
          `PIX_CASH_IN_WAS_RECEIVED: No recipient account number in payload: ${data.authenticationCode}`,
        );
        continue;
      }

      const account = await this.accountService.findByNumber(
        recipientAccountNumber,
      );
      if (!account) {
        this.logger.warn(
          `PIX_CASH_IN_WAS_RECEIVED: Account not found for number ${recipientAccountNumber}: ${data.authenticationCode}`,
        );
        continue;
      }

      const clientId = account.clientId;
      const accountId = account.id;

      const pixCashIn = this.pixCashInRepository.create({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        status: PixCashInStatus.RECEIVED,
        providerSlug: FinancialProvider.HIPERBANCO,
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        endToEndId: data.channel?.end2EndId,
        initializationType: data.channel?.pixInitializationType,
        receiverReconciliationId: data.channel?.receiverReconciliationId,
        paymentPriority: data.channel?.pixPaymentPriority,
        paymentPriorityType: data.channel?.pixPaymentPriorityType,
        paymentPurpose: data.channel?.pixPaymentPurpose,
        addressingKeyValue: data.addressingKey?.value,
        addressingKeyType: data.addressingKey?.type,
        sender: {
          type: data.channel?.sender?.type,
          documentType: data.channel?.sender?.document?.type,
          documentNumber: data.channel?.sender?.document?.value,
          name: data.channel?.sender?.name,
          accountBranch: data.channel?.sender?.account?.branch,
          accountNumber: data.channel?.sender?.account?.number,
          accountType: data.channel?.sender?.account?.type,
          bankIspb: data.channel?.sender?.account?.bank?.ispb,
          bankName: data.channel?.sender?.account?.bank?.name,
        },
        recipient: {
          type: data.recipient?.type,
          documentType: data.recipient?.document?.type,
          documentNumber: data.recipient?.document?.value,
          name: data.recipient?.name,
          accountBranch: data.recipient?.account?.branch,
          accountNumber: data.recipient?.account?.number,
          accountType: data.recipient?.account?.type,
          bankIspb: data.recipient?.account?.bank?.ispb,
        },
        clientId,
        accountId,
        providerCreatedAt: data.createdAt
          ? parseDate(data.createdAt)
          : undefined,
      });

      const saved = await this.pixCashInRepository.save(pixCashIn);

      let pixQrCodeId: string | undefined;
      const conciliationId = data.channel?.receiverReconciliationId;
      const initializationType = data.channel?.pixInitializationType;

      const qrCodeTypes: string[] = [
        PixInitializationType.STATIC_QR_CODE,
        PixInitializationType.DYNAMIC_QR_CODE,
      ];

      if (
        conciliationId &&
        initializationType &&
        qrCodeTypes.includes(initializationType)
      ) {
        const pixQrCode = await this.pixQrCodeRepository.findOne({
          where: { conciliationId },
        });

        if (pixQrCode) {
          pixQrCodeId = pixQrCode.id;
          if (pixQrCode.status !== PixQrCodeStatus.PAID) {
            pixQrCode.status = PixQrCodeStatus.PAID;
            await this.pixQrCodeRepository.save(pixQrCode);
          }
        }
      }

      await this.transactionService.createFromWebhook({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        type: TransactionType.PIX_CASH_IN,
        status: mapWebhookEventToTransactionStatus('PIX_CASH_IN_WAS_RECEIVED'),
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        clientId,
        accountId,
        pixCashInId: saved.id,
        pixQrCodeId,
        providerTimestamp: parseDate(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_CASH_IN',
        entityId: saved.id,
        eventName: WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: parseDate(event.timestamp),
        clientId,
      });

      this.logger.log(
        `PIX_CASH_IN_WAS_RECEIVED processed: ${data.authenticationCode} (account: ${recipientAccountNumber}, clientId: ${clientId})`,
      );
    }
  }

  async handleCashInCleared(
    events: WebhookPayload<PixCashInClearedData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('PIX_CASH_IN_WAS_CLEARED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;
      // Use entityId from envelope as authenticationCode if not present in data
      const authenticationCode = data.authenticationCode || event.entityId;

      if (!authenticationCode) {
        this.logger.warn(
          'PIX_CASH_IN_WAS_CLEARED: No authenticationCode or entityId available',
        );
        continue;
      }

      const pixCashIn = await this.pixCashInRepository.findOne({
        where: { authenticationCode },
      });

      if (!pixCashIn) {
        this.logger.warn(
          `PixCashIn not found for CLEARED: ${authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          authenticationCode,
          'PIX_CASH_IN_WAS_CLEARED',
        );
      }

      const lastEvent =
        await this.webhookEventLogService.getLastProcessedEvent(
          authenticationCode,
        );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `PIX_CASH_IN_WAS_CLEARED: Out of sequence - ${validation.reason} - will retry`,
          { authenticationCode },
        );
        throw new WebhookOutOfSequenceRetryableException(
          authenticationCode,
          'PIX_CASH_IN_WAS_CLEARED',
          validation.reason || 'Unknown reason',
        );
      }

      pixCashIn.status = PixCashInStatus.CLEARED;
      await this.pixCashInRepository.save(pixCashIn);

      await this.transactionService.updateFromWebhook({
        authenticationCode,
        status: mapWebhookEventToTransactionStatus('PIX_CASH_IN_WAS_CLEARED'),
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        description: data.description,
        providerTimestamp: parseDate(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode,
        entityType: 'PIX_CASH_IN',
        entityId: pixCashIn.id,
        eventName: WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: parseDate(event.timestamp),
        clientId,
      });

      this.logger.log(
        `PIX_CASH_IN_WAS_CLEARED processed: ${authenticationCode}`,
      );
    }
  }

  async handleCashOutCompleted(
    events: WebhookPayload<PixCashOutData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    await this.processCashOutEvent(
      events,
      PixTransferStatus.DONE,
      WebhookEvent.PIX_CASHOUT_WAS_COMPLETED,
      clientId,
      validPublicKey,
    );
  }

  async handleCashOutCanceled(
    events: WebhookPayload<PixCashOutData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    await this.processCashOutEvent(
      events,
      PixTransferStatus.CANCELED,
      WebhookEvent.PIX_CASHOUT_WAS_CANCELED,
      clientId,
      validPublicKey,
    );
  }

  async handleCashOutUndone(
    events: WebhookPayload<PixCashOutData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    await this.processCashOutEvent(
      events,
      PixTransferStatus.UNDONE,
      WebhookEvent.PIX_CASHOUT_WAS_UNDONE,
      clientId,
      validPublicKey,
    );
  }

  private async processCashOutEvent(
    events: WebhookPayload<PixCashOutData>[],
    status: PixTransferStatus,
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

      const pixTransfer = await this.pixTransferRepository.findOne({
        where: { authenticationCode: data.authenticationCode },
      });

      if (!pixTransfer) {
        this.logger.warn(
          `PixTransfer not found: ${data.authenticationCode} - will retry`,
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

      pixTransfer.status = status;
      pixTransfer.paymentDate = data.paymentDate
        ? parseDate(data.paymentDate)
        : undefined;
      pixTransfer.isRefund = data.isRefund || false;
      pixTransfer.endToEndIdOriginal = data.endToEndIdOriginal;
      pixTransfer.refusalReason = data.channel?.refusalReason;
      pixTransfer.isPixOpenBanking = data.channel?.isPixOpenBanking || false;
      pixTransfer.isInternal = data.channel?.isInternal || false;

      if (!pixTransfer.endToEndId && data.channel?.endToEndId) {
        pixTransfer.endToEndId = data.channel.endToEndId;
      }

      await this.pixTransferRepository.save(pixTransfer);

      await this.transactionService.updateFromWebhook({
        authenticationCode: data.authenticationCode,
        status: mapWebhookEventToTransactionStatus(eventName),
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        description: data.description,
        providerTimestamp: parseDate(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_TRANSFER',
        entityId: pixTransfer.id,
        eventName,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: parseDate(event.timestamp),
        clientId,
      });

      this.logger.log(`${eventName} processed: ${data.authenticationCode}`);
    }
  }

  async handleRefundReceived(
    events: WebhookPayload<PixRefundData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('PIX_REFUND_WAS_RECEIVED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const existing = await this.pixRefundRepository.findOne({
        where: { authenticationCode: data.authenticationCode },
      });

      if (existing) {
        this.logger.log(`PixRefund already exists: ${data.authenticationCode}`);
        continue;
      }

      let relatedPixCashInId: string | undefined;
      let relatedPixTransferId: string | undefined;

      if (data.channel?.end2EndIdOriginal) {
        const cashIn = await this.pixCashInRepository.findOne({
          where: { endToEndId: data.channel.end2EndIdOriginal },
        });
        if (cashIn) relatedPixCashInId = cashIn.id;

        const transfer = await this.pixTransferRepository.findOne({
          where: { endToEndId: data.channel.end2EndIdOriginal },
        });
        if (transfer) relatedPixTransferId = transfer.id;
      }

      const pixRefund = this.pixRefundRepository.create({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        status: PixRefundStatus.RECEIVED,
        providerSlug: FinancialProvider.HIPERBANCO,
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        endToEndId: data.channel?.end2EndId,
        endToEndIdOriginal: data.channel?.end2EndIdOriginal,
        refundReason: data.channel?.refundReason,
        errorCode: data.channel?.errorCode,
        errorReason: data.channel?.errorReason,
        sender: {
          type: data.channel?.sender?.type,
          documentType: data.channel?.sender?.document?.type,
          documentNumber: data.channel?.sender?.document?.value,
          name: data.channel?.sender?.name,
        },
        recipient: {
          type: data.recipient?.type,
          documentType: data.recipient?.document?.type,
          documentNumber: data.recipient?.document?.value,
        },
        relatedPixCashInId,
        relatedPixTransferId,
        clientId,
        providerCreatedAt: data.createdAt
          ? parseDate(data.createdAt)
          : undefined,
      });

      const saved = await this.pixRefundRepository.save(pixRefund);

      await this.transactionService.createFromWebhook({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        type: TransactionType.PIX_REFUND,
        status: mapWebhookEventToTransactionStatus('PIX_REFUND_WAS_RECEIVED'),
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        clientId,
        pixRefundId: saved.id,
        providerTimestamp: parseDate(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_REFUND',
        entityId: saved.id,
        eventName: WebhookEvent.PIX_REFUND_WAS_RECEIVED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: parseDate(event.timestamp),
        clientId,
      });

      this.logger.log(
        `PIX_REFUND_WAS_RECEIVED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleRefundCleared(
    events: WebhookPayload<PixRefundData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('PIX_REFUND_WAS_CLEARED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const pixRefund = await this.pixRefundRepository.findOne({
        where: { authenticationCode: data.authenticationCode },
      });

      if (!pixRefund) {
        this.logger.warn(
          `PixRefund not found for CLEARED: ${data.authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          data.authenticationCode,
          'PIX_REFUND_WAS_CLEARED',
        );
      }

      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.PIX_REFUND_WAS_CLEARED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `PIX_REFUND_WAS_CLEARED: Out of sequence - ${validation.reason} - will retry`,
          { authenticationCode: data.authenticationCode },
        );
        throw new WebhookOutOfSequenceRetryableException(
          data.authenticationCode,
          'PIX_REFUND_WAS_CLEARED',
          validation.reason || 'Unknown reason',
        );
      }

      pixRefund.status = PixRefundStatus.CLEARED;
      await this.pixRefundRepository.save(pixRefund);

      await this.transactionService.updateFromWebhook({
        authenticationCode: data.authenticationCode,
        status: mapWebhookEventToTransactionStatus('PIX_REFUND_WAS_CLEARED'),
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        description: data.description,
        providerTimestamp: parseDate(event.timestamp),
      });

      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_REFUND',
        entityId: pixRefund.id,
        eventName: WebhookEvent.PIX_REFUND_WAS_CLEARED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: parseDate(event.timestamp),
        clientId,
      });

      this.logger.log(
        `PIX_REFUND_WAS_CLEARED processed: ${data.authenticationCode}`,
      );
    }
  }

  /**
   * Processa evento PIX_QRCODE_WAS_CREATED.
   * Atualiza o PixQrCode existente ou cria novo registro com dados do webhook.
   */
  async handleQrCodeCreated(
    events: WebhookPayload<PixQrCodeCreatedData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('PIX_QRCODE_WAS_CREATED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      // Verificar se já existe pelo conciliationId
      let pixQrCode = await this.pixQrCodeRepository.findOne({
        where: { conciliationId: data.conciliationId },
      });

      if (pixQrCode) {
        // Atualizar registro existente com dados do webhook
        pixQrCode.encodedValue = data.encodedValue;
        pixQrCode.status = PixQrCodeStatus.CREATED;
        if (data.expiresAt) {
          pixQrCode.expiresAt = parseDate(data.expiresAt);
        }
        await this.pixQrCodeRepository.save(pixQrCode);

        this.logger.log(
          `PIX_QRCODE_WAS_CREATED updated existing: ${data.conciliationId}`,
        );
      } else {
        // Buscar conta pelo recipient para obter clientId e accountId
        const account = await this.accountService.findByOnboardingDocument(
          data.recipient.documentNumber,
        );

        if (!account) {
          this.logger.warn(
            `PIX_QRCODE_WAS_CREATED: Account not found for document ${data.recipient.documentNumber}`,
          );
          continue;
        }

        // Criar novo registro
        pixQrCode = this.pixQrCodeRepository.create({
          conciliationId: data.conciliationId,
          encodedValue: data.encodedValue,
          type:
            data.type === 'STATIC'
              ? PixQrCodeType.STATIC
              : PixQrCodeType.DYNAMIC,
          status: PixQrCodeStatus.CREATED,
          amount: data.amount,
          addressingKeyType: data.addressingKey.type as any,
          addressingKeyValue: data.addressingKey.value,
          recipientName: data.recipient.name,
          singlePayment: data.singlePayment,
          changeAmountType: data.changeAmountType,
          expiresAt: data.expiresAt ? parseDate(data.expiresAt) : undefined,
          providerSlug: FinancialProvider.HIPERBANCO,
          clientId: account.clientId,
          accountId: account.id,
        });

        const saved = await this.pixQrCodeRepository.save(pixQrCode);

        this.logger.log(
          `PIX_QRCODE_WAS_CREATED created new: ${data.conciliationId} (id: ${saved.id})`,
        );
      }

      await this.webhookEventLogService.logEvent({
        authenticationCode: data.conciliationId,
        entityType: 'PIX_QR_CODE',
        entityId: pixQrCode.id,
        eventName: WebhookEvent.PIX_QRCODE_WAS_CREATED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: parseDate(event.timestamp),
        clientId,
      });
    }
  }
}
