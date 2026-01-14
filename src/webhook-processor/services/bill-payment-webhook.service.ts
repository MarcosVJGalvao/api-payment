import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillPayment } from '@/bill-payment/entities/bill-payment.entity';
import { BillPaymentStatus } from '@/bill-payment/enums/bill-payment-status.enum';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BillPaymentWebhookData } from '../interfaces/bill-payment-webhook.interface';
import { mapWebhookEventToTransactionStatus } from '../helpers/transaction-status-mapper.helper';
import { canProcessWebhook } from '../helpers/webhook-state-machine.helper';
import { WebhookEventLogService } from './webhook-event-log.service';
import { WebhookEvent } from '../enums/webhook-event.enum';

@Injectable()
export class BillPaymentWebhookService {
  private readonly logger = new Logger(BillPaymentWebhookService.name);

  constructor(
    @InjectRepository(BillPayment)
    private readonly billPaymentRepository: Repository<BillPayment>,
    private readonly transactionService: TransactionService,
    private readonly webhookEventLogService: WebhookEventLogService,
  ) {}

  async handleReceived(
    events: WebhookPayload<BillPaymentWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn(
        'BILL_PAYMENT_WAS_RECEIVED: Invalid publicKey, skipping',
      );
      return;
    }

    for (const event of events) {
      const data = event.data;

      const billPayment = await this.findBillPayment(data.authenticationCode);

      if (!billPayment) {
        this.logger.warn(
          `BillPayment not found for RECEIVED: ${data.authenticationCode}`,
        );
        continue;
      }

      billPayment.status = BillPaymentStatus.CREATED;
      if (data.transactionId) billPayment.transactionId = data.transactionId;
      if (data.settleDate) billPayment.settleDate = new Date(data.settleDate);
      if (data.paymentDate)
        billPayment.paymentDate = new Date(data.paymentDate);

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.createFromWebhook({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        type: TransactionType.BILL_PAYMENT,
        status: mapWebhookEventToTransactionStatus('BILL_PAYMENT_WAS_RECEIVED'),
        amount: data.amount?.value || billPayment.amount,
        currency: data.amount?.currency || 'BRL',
        clientId,
        billPaymentId: billPayment.id,
        accountId: billPayment.accountId,
        providerTimestamp: new Date(event.timestamp),
      });

      // Registra o evento no log
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BILL_PAYMENT',
        entityId: billPayment.id,
        eventName: WebhookEvent.BILL_PAYMENT_WAS_RECEIVED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BILL_PAYMENT_WAS_RECEIVED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCreated(
    events: WebhookPayload<BillPaymentWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('BILL_PAYMENT_WAS_CREATED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const billPayment = await this.findBillPayment(data.authenticationCode);

      if (!billPayment) {
        this.logger.warn(
          `BillPayment not found for CREATED: ${data.authenticationCode}`,
        );
        continue;
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.BILL_PAYMENT_WAS_CREATED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `BILL_PAYMENT_WAS_CREATED: Out of sequence - ${validation.reason}`,
          { authenticationCode: data.authenticationCode },
        );
        await this.webhookEventLogService.logEvent({
          authenticationCode: data.authenticationCode,
          entityType: 'BILL_PAYMENT',
          entityId: billPayment.id,
          eventName: WebhookEvent.BILL_PAYMENT_WAS_CREATED,
          wasProcessed: false,
          skipReason: validation.reason,
          payload: event as unknown as Record<string, unknown>,
          providerTimestamp: new Date(event.timestamp),
          clientId,
        });
        continue;
      }

      billPayment.status = BillPaymentStatus.CREATED;
      if (data.confirmationTransactionId) {
        billPayment.confirmationTransactionId = String(
          data.confirmationTransactionId,
        );
      }

      await this.billPaymentRepository.save(billPayment);

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BILL_PAYMENT',
        entityId: billPayment.id,
        eventName: WebhookEvent.BILL_PAYMENT_WAS_CREATED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BILL_PAYMENT_WAS_CREATED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleConfirmed(
    events: WebhookPayload<BillPaymentWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn(
        'BILL_PAYMENT_WAS_CONFIRMED: Invalid publicKey, skipping',
      );
      return;
    }

    for (const event of events) {
      const data = event.data;

      const billPayment = await this.findBillPayment(data.authenticationCode);

      if (!billPayment) {
        this.logger.warn(
          `BillPayment not found for CONFIRMED: ${data.authenticationCode}`,
        );
        continue;
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `BILL_PAYMENT_WAS_CONFIRMED: Out of sequence - ${validation.reason}`,
          { authenticationCode: data.authenticationCode },
        );
        await this.webhookEventLogService.logEvent({
          authenticationCode: data.authenticationCode,
          entityType: 'BILL_PAYMENT',
          entityId: billPayment.id,
          eventName: WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED,
          wasProcessed: false,
          skipReason: validation.reason,
          payload: event as unknown as Record<string, unknown>,
          providerTimestamp: new Date(event.timestamp),
          clientId,
        });
        continue;
      }

      billPayment.status = BillPaymentStatus.CONFIRMED;
      if (data.confirmedAt)
        billPayment.confirmedAt = new Date(data.confirmedAt);

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BILL_PAYMENT_WAS_CONFIRMED'),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BILL_PAYMENT',
        entityId: billPayment.id,
        eventName: WebhookEvent.BILL_PAYMENT_WAS_CONFIRMED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BILL_PAYMENT_WAS_CONFIRMED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleFailed(
    events: WebhookPayload<BillPaymentWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('BILL_PAYMENT_HAS_FAILED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const billPayment = await this.findBillPayment(data.authenticationCode);

      if (!billPayment) {
        this.logger.warn(
          `BillPayment not found for FAILED: ${data.authenticationCode}`,
        );
        continue;
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.BILL_PAYMENT_HAS_FAILED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `BILL_PAYMENT_HAS_FAILED: Out of sequence - ${validation.reason}`,
          { authenticationCode: data.authenticationCode },
        );
        await this.webhookEventLogService.logEvent({
          authenticationCode: data.authenticationCode,
          entityType: 'BILL_PAYMENT',
          entityId: billPayment.id,
          eventName: WebhookEvent.BILL_PAYMENT_HAS_FAILED,
          wasProcessed: false,
          skipReason: validation.reason,
          payload: event as unknown as Record<string, unknown>,
          providerTimestamp: new Date(event.timestamp),
          clientId,
        });
        continue;
      }

      billPayment.status = BillPaymentStatus.CANCELLED;
      billPayment.errorCode = data.error?.code;
      billPayment.errorMessage = data.error?.message;

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BILL_PAYMENT_HAS_FAILED'),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BILL_PAYMENT',
        entityId: billPayment.id,
        eventName: WebhookEvent.BILL_PAYMENT_HAS_FAILED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BILL_PAYMENT_HAS_FAILED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCancelled(
    events: WebhookPayload<BillPaymentWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn(
        'BILL_PAYMENT_WAS_CANCELLED: Invalid publicKey, skipping',
      );
      return;
    }

    for (const event of events) {
      const data = event.data;

      const billPayment = await this.findBillPayment(data.authenticationCode);

      if (!billPayment) {
        this.logger.warn(
          `BillPayment not found for CANCELLED: ${data.authenticationCode}`,
        );
        continue;
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `BILL_PAYMENT_WAS_CANCELLED: Out of sequence - ${validation.reason}`,
          { authenticationCode: data.authenticationCode },
        );
        await this.webhookEventLogService.logEvent({
          authenticationCode: data.authenticationCode,
          entityType: 'BILL_PAYMENT',
          entityId: billPayment.id,
          eventName: WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,
          wasProcessed: false,
          skipReason: validation.reason,
          payload: event as unknown as Record<string, unknown>,
          providerTimestamp: new Date(event.timestamp),
          clientId,
        });
        continue;
      }

      billPayment.status = BillPaymentStatus.CANCELLED;
      billPayment.cancelReason = data.reason;

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BILL_PAYMENT_WAS_CANCELLED'),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BILL_PAYMENT',
        entityId: billPayment.id,
        eventName: WebhookEvent.BILL_PAYMENT_WAS_CANCELLED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BILL_PAYMENT_WAS_CANCELLED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleRefused(
    events: WebhookPayload<BillPaymentWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('BILL_PAYMENT_WAS_REFUSED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const billPayment = await this.findBillPayment(data.authenticationCode);

      if (!billPayment) {
        this.logger.warn(
          `BillPayment not found for REFUSED: ${data.authenticationCode}`,
        );
        continue;
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.BILL_PAYMENT_WAS_REFUSED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `BILL_PAYMENT_WAS_REFUSED: Out of sequence - ${validation.reason}`,
          { authenticationCode: data.authenticationCode },
        );
        await this.webhookEventLogService.logEvent({
          authenticationCode: data.authenticationCode,
          entityType: 'BILL_PAYMENT',
          entityId: billPayment.id,
          eventName: WebhookEvent.BILL_PAYMENT_WAS_REFUSED,
          wasProcessed: false,
          skipReason: validation.reason,
          payload: event as unknown as Record<string, unknown>,
          providerTimestamp: new Date(event.timestamp),
          clientId,
        });
        continue;
      }

      billPayment.status = BillPaymentStatus.CANCELLED;

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BILL_PAYMENT_WAS_REFUSED'),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BILL_PAYMENT',
        entityId: billPayment.id,
        eventName: WebhookEvent.BILL_PAYMENT_WAS_REFUSED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BILL_PAYMENT_WAS_REFUSED processed: ${data.authenticationCode}`,
      );
    }
  }

  private async findBillPayment(
    authenticationCode: string,
  ): Promise<BillPayment | null> {
    return this.billPaymentRepository.findOne({
      where: { authenticationCode },
    });
  }
}
