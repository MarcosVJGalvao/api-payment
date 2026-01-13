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

@Injectable()
export class BillPaymentWebhookService {
  private readonly logger = new Logger(BillPaymentWebhookService.name);

  constructor(
    @InjectRepository(BillPayment)
    private readonly billPaymentRepository: Repository<BillPayment>,
    private readonly transactionService: TransactionService,
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

      this.logger.log(
        `BILL_PAYMENT_WAS_RECEIVED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCreated(
    events: WebhookPayload<BillPaymentWebhookData>[],
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

      billPayment.status = BillPaymentStatus.CREATED;
      if (data.confirmationTransactionId) {
        billPayment.confirmationTransactionId = String(
          data.confirmationTransactionId,
        );
      }

      await this.billPaymentRepository.save(billPayment);
      this.logger.log(
        `BILL_PAYMENT_WAS_CREATED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleConfirmed(
    events: WebhookPayload<BillPaymentWebhookData>[],
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

      billPayment.status = BillPaymentStatus.CONFIRMED;
      if (data.confirmedAt)
        billPayment.confirmedAt = new Date(data.confirmedAt);

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BILL_PAYMENT_WAS_CONFIRMED'),
      );

      this.logger.log(
        `BILL_PAYMENT_WAS_CONFIRMED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleFailed(
    events: WebhookPayload<BillPaymentWebhookData>[],
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

      billPayment.status = BillPaymentStatus.CANCELLED;
      billPayment.errorCode = data.error?.code;
      billPayment.errorMessage = data.error?.message;

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BILL_PAYMENT_HAS_FAILED'),
      );

      this.logger.log(
        `BILL_PAYMENT_HAS_FAILED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCancelled(
    events: WebhookPayload<BillPaymentWebhookData>[],
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

      billPayment.status = BillPaymentStatus.CANCELLED;
      billPayment.cancelReason = data.reason;

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BILL_PAYMENT_WAS_CANCELLED'),
      );

      this.logger.log(
        `BILL_PAYMENT_WAS_CANCELLED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleRefused(
    events: WebhookPayload<BillPaymentWebhookData>[],
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

      billPayment.status = BillPaymentStatus.CANCELLED;

      await this.billPaymentRepository.save(billPayment);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BILL_PAYMENT_WAS_REFUSED'),
      );

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
