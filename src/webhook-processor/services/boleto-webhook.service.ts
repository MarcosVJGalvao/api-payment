import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleto } from '@/boleto/entities/boleto.entity';
import { BoletoStatus } from '@/boleto/enums/boleto-status.enum';
import { TransactionService } from '@/transaction/transaction.service';
import { TransactionType } from '@/transaction/enums/transaction-type.enum';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BoletoWebhookData } from '../interfaces/boleto-webhook.interface';
import { mapWebhookEventToTransactionStatus } from '../helpers/transaction-status-mapper.helper';
import { canProcessWebhook } from '../helpers/webhook-state-machine.helper';
import { WebhookEventLogService } from './webhook-event-log.service';
import { WebhookEvent } from '../enums/webhook-event.enum';
import { TransactionNotFoundRetryableException } from '@/common/errors/exceptions/transaction-not-found-retryable.exception';
import { WebhookOutOfSequenceRetryableException } from '@/common/errors/exceptions/webhook-out-of-sequence-retryable.exception';

@Injectable()
export class BoletoWebhookService {
  private readonly logger = new Logger(BoletoWebhookService.name);

  constructor(
    @InjectRepository(Boleto)
    private readonly boletoRepository: Repository<Boleto>,
    private readonly transactionService: TransactionService,
    private readonly webhookEventLogService: WebhookEventLogService,
  ) {}

  async handleRegistered(
    events: WebhookPayload<BoletoWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('BOLETO_WAS_REGISTERED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;
      const ourNumber = data.channel?.ourNumber;

      const boleto = await this.findBoleto(data.authenticationCode, ourNumber);

      if (!boleto) {
        this.logger.warn(
          `Boleto not found for REGISTERED: ${data.authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          data.authenticationCode,
          'BOLETO_WAS_REGISTERED',
        );
      }

      boleto.authenticationCode = data.authenticationCode;
      boleto.barcode = data.barcode || boleto.barcode;
      boleto.digitable = data.digitable || boleto.digitable;
      boleto.ourNumber = ourNumber || boleto.ourNumber;
      boleto.status = BoletoStatus.REGISTERED;

      await this.boletoRepository.save(boleto);

      // Registra o evento no log
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BOLETO',
        entityId: boleto.id,
        eventName: WebhookEvent.BOLETO_WAS_REGISTERED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BOLETO_WAS_REGISTERED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCashInReceived(
    events: WebhookPayload<BoletoWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn(
        'BOLETO_CASH_IN_WAS_RECEIVED: Invalid publicKey, skipping',
      );
      return;
    }

    for (const event of events) {
      const data = event.data;

      const boleto = await this.findBoleto(
        data.authenticationCode,
        data.channel?.ourNumber,
      );

      if (!boleto) {
        this.logger.warn(
          `Boleto not found for CASH_IN_RECEIVED: ${data.authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          data.authenticationCode,
          'BOLETO_CASH_IN_WAS_RECEIVED',
        );
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `BOLETO_CASH_IN_WAS_RECEIVED: Out of sequence - ${validation.reason} - will retry`,
          { authenticationCode: data.authenticationCode },
        );
        throw new WebhookOutOfSequenceRetryableException(
          data.authenticationCode,
          'BOLETO_CASH_IN_WAS_RECEIVED',
          validation.reason || 'Unknown reason',
        );
      }

      boleto.status = BoletoStatus.PROCESSING;
      await this.boletoRepository.save(boleto);

      await this.transactionService.createFromWebhook({
        authenticationCode: data.authenticationCode,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        entityId: event.entityId,
        type: TransactionType.BOLETO_CASH_IN,
        status: mapWebhookEventToTransactionStatus(
          'BOLETO_CASH_IN_WAS_RECEIVED',
        ),
        amount: data.amount?.value || boleto.amount,
        currency: data.amount?.currency || 'BRL',
        clientId,
        boletoId: boleto.id,
        accountId: boleto.accountId,
        providerTimestamp: new Date(event.timestamp),
      });

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BOLETO',
        entityId: boleto.id,
        eventName: WebhookEvent.BOLETO_CASH_IN_WAS_RECEIVED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BOLETO_CASH_IN_WAS_RECEIVED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCashInCleared(
    events: WebhookPayload<BoletoWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn(
        'BOLETO_CASH_IN_WAS_CLEARED: Invalid publicKey, skipping',
      );
      return;
    }

    for (const event of events) {
      const data = event.data;

      const boleto = await this.findBoleto(
        data.authenticationCode,
        data.channel?.ourNumber,
      );

      if (!boleto) {
        this.logger.warn(
          `Boleto not found for CASH_IN_CLEARED: ${data.authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          data.authenticationCode,
          'BOLETO_CASH_IN_WAS_CLEARED',
        );
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `BOLETO_CASH_IN_WAS_CLEARED: Out of sequence - ${validation.reason} - will retry`,
          { authenticationCode: data.authenticationCode },
        );
        throw new WebhookOutOfSequenceRetryableException(
          data.authenticationCode,
          'BOLETO_CASH_IN_WAS_CLEARED',
          validation.reason || 'Unknown reason',
        );
      }

      boleto.status = BoletoStatus.PAID;
      await this.boletoRepository.save(boleto);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BOLETO_CASH_IN_WAS_CLEARED'),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BOLETO',
        entityId: boleto.id,
        eventName: WebhookEvent.BOLETO_CASH_IN_WAS_CLEARED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BOLETO_CASH_IN_WAS_CLEARED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCancelled(
    events: WebhookPayload<BoletoWebhookData>[],
    clientId: string,
    validPublicKey: boolean,
  ): Promise<void> {
    if (!validPublicKey) {
      this.logger.warn('BOLETO_WAS_CANCELLED: Invalid publicKey, skipping');
      return;
    }

    for (const event of events) {
      const data = event.data;

      const boleto = await this.findBoleto(
        data.authenticationCode,
        data.channel?.ourNumber,
      );

      if (!boleto) {
        this.logger.warn(
          `Boleto not found for CANCELLED: ${data.authenticationCode} - will retry`,
        );
        throw new TransactionNotFoundRetryableException(
          data.authenticationCode,
          'BOLETO_WAS_CANCELLED',
        );
      }

      // Validar sequência de webhook
      const lastEvent = await this.webhookEventLogService.getLastProcessedEvent(
        data.authenticationCode,
      );
      const validation = canProcessWebhook(
        lastEvent,
        WebhookEvent.BOLETO_WAS_CANCELLED,
      );

      if (!validation.canProcess) {
        this.logger.warn(
          `BOLETO_WAS_CANCELLED: Out of sequence - ${validation.reason} - will retry`,
          { authenticationCode: data.authenticationCode },
        );
        throw new WebhookOutOfSequenceRetryableException(
          data.authenticationCode,
          'BOLETO_WAS_CANCELLED',
          validation.reason || 'Unknown reason',
        );
      }

      boleto.status = BoletoStatus.CANCELLED;
      boleto.cancelReason = data.reason;
      await this.boletoRepository.save(boleto);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BOLETO_WAS_CANCELLED'),
      );

      // Registra o evento como processado
      await this.webhookEventLogService.logEvent({
        authenticationCode: data.authenticationCode,
        entityType: 'BOLETO',
        entityId: boleto.id,
        eventName: WebhookEvent.BOLETO_WAS_CANCELLED,
        wasProcessed: true,
        payload: event as unknown as Record<string, unknown>,
        providerTimestamp: new Date(event.timestamp),
        clientId,
      });

      this.logger.log(
        `BOLETO_WAS_CANCELLED processed: ${data.authenticationCode}`,
      );
    }
  }

  private async findBoleto(
    authenticationCode: string,
    ourNumber?: string,
  ): Promise<Boleto | null> {
    let boleto = await this.boletoRepository.findOne({
      where: { authenticationCode },
    });

    if (!boleto && ourNumber) {
      boleto = await this.boletoRepository.findOne({
        where: { ourNumber },
      });
    }

    return boleto;
  }
}
