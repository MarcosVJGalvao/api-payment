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
import {
  enqueueWebhookEvent,
  WebhookJobBase,
} from '../helpers/enqueue-webhook.helper';
import { BoletoWebhookNormalizerRegistry } from '../registries/boleto-webhook-normalizer.registry';
import { parseFinancialProvider } from '../helpers/provider-slug.helper';
import { isRecord } from '@/common/errors/helpers/type.helpers';

@ApiTags('Webhooks - Boleto')
@Controller('webhook/:provider/boleto')
@UseGuards(WebhookPublicKeyGuard)
export class BoletoWebhookController {
  constructor(
    @InjectQueue('webhook-boleto')
    private readonly webhookQueue: Queue<WebhookJobBase>,
    private readonly normalizerRegistry: BoletoWebhookNormalizerRegistry,
  ) {}

  private getProvider(request: Request) {
    return parseFinancialProvider(String(request.params?.provider || ''));
  }

  private getHeaders(request: Request): Record<string, unknown> {
    return isRecord(request.headers) ? request.headers : {};
  }

  @Post('registered')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BOLETO_WAS_REGISTERED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRegistered(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeRegistered(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'REGISTERED',
      normalized,
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
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCashInReceived(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_IN_RECEIVED',
      normalized,
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
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCashInCleared(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_IN_CLEARED',
      normalized,
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
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCancelled(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CANCELLED',
      normalized,
      request,
    );
  }
}
