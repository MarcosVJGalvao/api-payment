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
import {
  PixCashInReceivedData,
  PixCashInClearedData,
  PixCashOutData,
  PixRefundData,
} from '../interfaces/pix-webhook.interface';
import type {
  PixWebhookJob,
  PixWebhookEventType,
} from '../processors/pix-webhook.processor';

/**
 * Controller que recebe webhooks de PIX e os enfileira para processamento assíncrono.
 * Responde 202 Accepted imediatamente após enfileirar.
 */
@ApiTags('Webhooks - PIX')
@Controller('webhook/:provider/pix')
@UseGuards(WebhookPublicKeyGuard)
export class PixWebhookController {
  constructor(
    @InjectQueue('webhook-pix')
    private readonly webhookQueue: Queue<PixWebhookJob>,
  ) {}

  /**
   * Enfileira um evento de webhook para processamento assíncrono.
   */
  private async enqueueEvent(
    eventType: PixWebhookEventType,
    events: unknown[],
    request: Request,
  ): Promise<{ received: boolean }> {
    const clientId = request.webhookClientId || '';
    const validPublicKey = request.validPublicKey || false;
    const jobId =
      events.length > 0
        ? (events[0] as WebhookPayload<unknown>).idempotencyKey
        : undefined;

    await this.webhookQueue.add(
      {
        eventType,
        events: events as PixWebhookJob['events'],
        clientId,
        validPublicKey,
      },
      { jobId },
    );

    return { received: true };
  }

  @Post('cash-in/received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASH_IN_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInReceived(
    @Body() events: WebhookPayload<PixCashInReceivedData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('CASH_IN_RECEIVED', events, request);
  }

  @Post('cash-in/cleared')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASH_IN_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInCleared(
    @Body() events: WebhookPayload<PixCashInClearedData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('CASH_IN_CLEARED', events, request);
  }

  @Post('cash-out/completed')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_COMPLETED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutCompleted(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('CASH_OUT_COMPLETED', events, request);
  }

  @Post('cash-out/canceled')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_CANCELED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutCanceled(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('CASH_OUT_CANCELED', events, request);
  }

  @Post('cash-out/undone')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_UNDONE' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutUndone(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('CASH_OUT_UNDONE', events, request);
  }

  @Post('refund/received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_REFUND_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefundReceived(
    @Body() events: WebhookPayload<PixRefundData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('REFUND_RECEIVED', events, request);
  }

  @Post('refund/cleared')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_REFUND_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefundCleared(
    @Body() events: WebhookPayload<PixRefundData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return this.enqueueEvent('REFUND_CLEARED', events, request);
  }
}
