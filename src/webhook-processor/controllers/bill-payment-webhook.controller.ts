import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { WebhookPublicKeyGuard } from '../guards/webhook-public-key.guard';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BillPaymentWebhookData } from '../interfaces/bill-payment-webhook.interface';
import type {
  BillPaymentWebhookJob,
  BillPaymentWebhookEventType,
} from '../processors/bill-payment-webhook.processor';

/**
 * Controller que recebe webhooks de pagamento de contas e os enfileira para processamento assíncrono.
 * Responde 202 Accepted imediatamente após enfileirar.
 */
@ApiTags('Webhooks - BillPayment')
@Controller('webhook/:provider/payment')
@UseGuards(WebhookPublicKeyGuard)
export class BillPaymentWebhookController {
  constructor(
    @InjectQueue('webhook-bill-payment')
    private readonly webhookQueue: Queue<BillPaymentWebhookJob>,
  ) {}

  /**
   * Enfileira um evento de webhook para processamento assíncrono.
   * Usa o idempotencyKey do primeiro evento como jobId para deduplicação.
   */
  private async enqueueEvent(
    eventType: BillPaymentWebhookEventType,
    events: WebhookPayload<BillPaymentWebhookData>[],
    request: Request,
  ): Promise<{ received: boolean }> {
    const clientId = request.webhookClientId || '';
    const validPublicKey = request.validPublicKey || false;

    // Usar idempotencyKey do primeiro evento como jobId para deduplicação
    const jobId = events.length > 0 ? events[0].idempotencyKey : undefined;

    await this.webhookQueue.add(
      {
        eventType,
        events,
        clientId,
        validPublicKey,
      },
      {
        jobId, // Bull rejeita jobs com mesmo ID (deduplicação)
      },
    );

    return { received: true };
  }

  @Post('received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleReceived(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('RECEIVED', events, request);
  }

  @Post('created')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CREATED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCreated(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('CREATED', events, request);
  }

  @Post('confirmed')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CONFIRMED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleConfirmed(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('CONFIRMED', events, request);
  }

  @Post('failed')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_HAS_FAILED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleFailed(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('FAILED', events, request);
  }

  @Post('cancelled')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CANCELLED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCancelled(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('CANCELLED', events, request);
  }

  @Post('refused')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_REFUSED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefused(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('REFUSED', events, request);
  }
}
