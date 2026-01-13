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

@Injectable()
export class BoletoWebhookService {
  private readonly logger = new Logger(BoletoWebhookService.name);

  constructor(
    @InjectRepository(Boleto)
    private readonly boletoRepository: Repository<Boleto>,
    private readonly transactionService: TransactionService,
  ) {}

  async handleRegistered(
    events: WebhookPayload<BoletoWebhookData>[],
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
          `Boleto not found for REGISTERED: ${data.authenticationCode}`,
        );
        continue;
      }

      boleto.authenticationCode = data.authenticationCode;
      boleto.barcode = data.barcode || boleto.barcode;
      boleto.digitable = data.digitable || boleto.digitable;
      boleto.status = BoletoStatus.REGISTERED;

      await this.boletoRepository.save(boleto);
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
          `Boleto not found for CASH_IN_RECEIVED: ${data.authenticationCode}`,
        );
        continue;
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

      this.logger.log(
        `BOLETO_CASH_IN_WAS_RECEIVED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCashInCleared(
    events: WebhookPayload<BoletoWebhookData>[],
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
          `Boleto not found for CASH_IN_CLEARED: ${data.authenticationCode}`,
        );
        continue;
      }

      boleto.status = BoletoStatus.PAID;
      await this.boletoRepository.save(boleto);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BOLETO_CASH_IN_WAS_CLEARED'),
      );

      this.logger.log(
        `BOLETO_CASH_IN_WAS_CLEARED processed: ${data.authenticationCode}`,
      );
    }
  }

  async handleCancelled(
    events: WebhookPayload<BoletoWebhookData>[],
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
          `Boleto not found for CANCELLED: ${data.authenticationCode}`,
        );
        continue;
      }

      boleto.status = BoletoStatus.CANCELLED;
      boleto.cancelReason = data.reason;
      await this.boletoRepository.save(boleto);

      await this.transactionService.updateStatus(
        data.authenticationCode,
        mapWebhookEventToTransactionStatus('BOLETO_WAS_CANCELLED'),
      );

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
