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
import { BoletoWebhookData } from '../interfaces/boleto-webhook.interface';
import type { BoletoWebhookJob } from '../processors/boleto-webhook.processor';
import { enqueueWebhookEvent } from '../helpers/enqueue-webhook.helper';

/**
 * Controller que recebe webhooks de boleto e os enfileira para processamento assíncrono.
 * Responde 202 Accepted imediatamente após enfileirar.
 */
@ApiTags('Webhooks - Boleto')
@Controller('webhook/:provider/boleto')
@UseGuards(WebhookPublicKeyGuard)
export class BoletoWebhookController {
  constructor(
    @InjectQueue('webhook-boleto')
    private readonly webhookQueue: Queue<BoletoWebhookJob>,
  ) {}

  @Post('registered')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BOLETO_WAS_REGISTERED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRegistered(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'REGISTERED',
      events,
      request,
    );
  }

  @Post('cash-in/received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BOLETO_CASH_IN_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInReceived(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_IN_RECEIVED',
      events,
      request,
    );
  }

  @Post('cash-in/cleared')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BOLETO_CASH_IN_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInCleared(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_IN_CLEARED',
      events,
      request,
    );
  }

  @Post('cancelled')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BOLETO_WAS_CANCELLED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCancelled(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CANCELLED',
      events,
      request,
    );
  }
}
