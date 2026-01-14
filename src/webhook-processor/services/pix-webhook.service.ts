import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PixCashIn } from '@/pix/entities/pix-cash-in.entity';
import { PixRefund, PixRefundStatus } from '@/pix/entities/pix-refund.entity';
import { PixTransfer } from '@/pix/entities/pix-transfer.entity';
import { PixTransferStatus } from '@/pix/enums/pix-transfer-status.enum';
import { PixCashInStatus } from '@/pix/enums/pix-cash-in-status.enum';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import {
  PixCashInReceivedData,
  PixCashInClearedData,
  PixCashOutData,
  PixRefundData,
} from '../interfaces/pix-webhook.interface';
import { mapWebhookEventToTransactionStatus } from '../helpers/transaction-status-mapper.helper';
import { canProcessWebhook } from '../helpers/webhook-state-machine.helper';
import { WebhookEventLogService } from './webhook-event-log.service';
import { WebhookEvent } from '../enums/webhook-event.enum';

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
    private readonly transactionService: TransactionService,
    private readonly webhookEventLogService: WebhookEventLogService,
  ) {}

  // ========================================
  // PIX Cash-In
  // ========================================

  async handleCashInReceived(
    events: WebhookPayload<PixCashInReceivedData>[],
    clientId: string,
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

      const pixCashIn = this.pixCashInRepository.create({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        status: PixCashInStatus.RECEIVED,
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
        senderDocumentType: data.channel?.sender?.document?.type,
        senderDocumentNumber: data.channel?.sender?.document?.value,
        senderName: data.channel?.sender?.name,
        senderType: data.channel?.sender?.type,
        senderAccountBranch: data.channel?.sender?.account?.branch,
        senderAccountNumber: data.channel?.sender?.account?.number,
        senderAccountType: data.channel?.sender?.account?.type,
        senderBankIspb: data.channel?.sender?.account?.bank?.ispb,
        senderBankName: data.channel?.sender?.account?.bank?.name,
        recipientDocumentType: data.recipient?.document?.type,
        recipientDocumentNumber: data.recipient?.document?.value,
        recipientName: data.recipient?.name,
        recipientType: data.recipient?.type,
        recipientAccountBranch: data.recipient?.account?.branch,
        recipientAccountNumber: data.recipient?.account?.number,
        recipientAccountType: data.recipient?.account?.type,
        recipientBankIspb: data.recipient?.account?.bank?.ispb,
        clientId,
        providerCreatedAt: data.createdAt
          ? new Date(data.createdAt)
          : undefined,
      });

      const saved = await this.pixCashInRepository.save(pixCashIn);

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
        pixCashInId: saved.id,
        providerTimestamp: new Date(event.timestamp),
      });

      // Registra o evento no log
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_CASH_IN',
        entityId: saved.id,
        eventName: WebhookEvent.PIX_CASH_IN_WAS_RECEIVED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `PIX_CASH_IN_WAS_RECEIVED processed: ${data.authenticationCode}`,
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

      const pixCashIn = await this.pixCashInRepository.findOne({
        where: { authenticationCode: data.authenticationCode },
      });

      if (!pixCashIn) {
        this.logger.warn(
          `PixCashIn not found for CLEARED: ${data.authenticationCode}`,
        );
        continue;
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `PIX_CASH_IN_WAS_CLEARED: Out of sequence - ${validation.reason}`,
          { authenticationCode: data.authenticationCode },
        );
        // Registra o evento como não processado
        await this.webhookEventLogService.logEvent({
          authenticationCode: data.authenticationCode,
          entityType: 'PIX_CASH_IN',
          entityId: pixCashIn.id,
          eventName: WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
          wasProcessed: false,
          skipReason: validation.reason,
          payload: event as unknown as Record<string, unknown>,
          providerTimestamp: new Date(event.timestamp),
          clientId,
        });
        continue;
      }

      pixCashIn.status = PixCashInStatus.CLEARED;
      await this.pixCashInRepository.save(pixCashIn);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('PIX_CASH_IN_WAS_CLEARED'),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_CASH_IN',
        entityId: pixCashIn.id,
        eventName: WebhookEvent.PIX_CASH_IN_WAS_CLEARED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `PIX_CASH_IN_WAS_CLEARED processed: ${data.authenticationCode}`,
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
        this.logger.warn(`PixTransfer not found: ${data.authenticationCode}`);
        continue;
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(lastEvent, eventName);

      if (!validation.canProcess) {
        this.logger.warn(
          `${eventName}: Out of sequence - ${validation.reason}`,
          { authenticationCode: data.authenticationCode },
        );
        await this.webhookEventLogService.logEvent({
          authenticationCode: data.authenticationCode,
          entityType: 'PIX_TRANSFER',
          entityId: pixTransfer.id,
          eventName,
          wasProcessed: false,
          skipReason: validation.reason,
          payload: event as unknown as Record<string, unknown>,
          providerTimestamp: new Date(event.timestamp),
          clientId,
        });
        continue;
      }

      pixTransfer.status = status;
      pixTransfer.paymentDate = data.paymentDate
        ? new Date(data.paymentDate)
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

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus(eventName),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_TRANSFER',
        entityId: pixTransfer.id,
        eventName,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
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
        amount: data.amount?.value,
        currency: data.amount?.currency || 'BRL',
        description: data.description,
        endToEndId: data.channel?.end2EndId,
        endToEndIdOriginal: data.channel?.end2EndIdOriginal,
        refundReason: data.channel?.refundReason,
        errorCode: data.channel?.errorCode,
        errorReason: data.channel?.errorReason,
        senderDocumentType: data.channel?.sender?.document?.type,
        senderDocumentNumber: data.channel?.sender?.document?.value,
        senderName: data.channel?.sender?.name,
        senderType: data.channel?.sender?.type,
        recipientDocumentType: data.recipient?.document?.type,
        recipientDocumentNumber: data.recipient?.document?.value,
        recipientType: data.recipient?.type,
        relatedPixCashInId,
        relatedPixTransferId,
        clientId,
        providerCreatedAt: data.createdAt
          ? new Date(data.createdAt)
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
        providerTimestamp: new Date(event.timestamp),
      });

      // Registra o evento no log
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_REFUND',
        entityId: saved.id,
        eventName: WebhookEvent.PIX_REFUND_WAS_RECEIVED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
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
          `PixRefund not found for CLEARED: ${data.authenticationCode}`,
        );
        continue;
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.PIX_REFUND_WAS_CLEARED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `PIX_REFUND_WAS_CLEARED: Out of sequence - ${validation.reason}`,
          { authenticationCode: data.authenticationCode },
        );
        await this.webhookEventLogService.logEvent({
          authenticationCode: data.authenticationCode,
          entityType: 'PIX_REFUND',
          entityId: pixRefund.id,
          eventName: WebhookEvent.PIX_REFUND_WAS_CLEARED,
          wasProcessed: false,
          skipReason: validation.reason,
          payload: event as unknown as Record<string, unknown>,
          providerTimestamp: new Date(event.timestamp),
          clientId,
        });
        continue;
      }

      pixRefund.status = PixRefundStatus.CLEARED;
      await this.pixRefundRepository.save(pixRefund);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('PIX_REFUND_WAS_CLEARED'),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'PIX_REFUND',
        entityId: pixRefund.id,
        eventName: WebhookEvent.PIX_REFUND_WAS_CLEARED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `PIX_REFUND_WAS_CLEARED processed: ${data.authenticationCode}`,
      );
    }
  }
}
