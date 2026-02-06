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
  PixQrCodeCreatedData,
} from '../interfaces/pix-webhook.interface';
import {
  enqueueWebhookEvent,
  WebhookJobBase,
} from '../helpers/enqueue-webhook.helper';
import { PixWebhookNormalizerRegistry } from '../registries/pix-webhook-normalizer.registry';
import { parseFinancialProvider } from '../helpers/provider-slug.helper';
import { isRecord } from '@/common/errors/helpers/type.helpers';

@ApiTags('Webhooks - PIX')
@Controller('webhook/:provider/pix')
@UseGuards(WebhookPublicKeyGuard)
export class PixWebhookController {
  constructor(
    @InjectQueue('webhook-pix')
    private readonly webhookQueue: Queue<WebhookJobBase>,
    private readonly normalizerRegistry: PixWebhookNormalizerRegistry,
  ) {}

  private getProvider(request: Request) {
    return parseFinancialProvider(String(request.params?.provider || ''));
  }

  private getHeaders(request: Request): Record<string, unknown> {
    return isRecord(request.headers) ? request.headers : {};
  }

  @Post('cash-in/received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASH_IN_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInReceived(
    @Body() events: WebhookPayload<PixCashInReceivedData>[],
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
  @ApiOperation({ summary: 'PIX_CASH_IN_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInCleared(
    @Body() events: WebhookPayload<PixCashInClearedData>[],
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

  @Post('cash-out/completed')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_COMPLETED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutCompleted(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCashOutCompleted(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_COMPLETED',
      normalized,
      request,
    );
  }

  @Post('cash-out/canceled')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_CANCELED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutCanceled(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCashOutCanceled(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_CANCELED',
      normalized,
      request,
    );
  }

  @Post('cash-out/undone')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_UNDONE' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutUndone(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCashOutUndone(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_UNDONE',
      normalized,
      request,
    );
  }

  @Post('refund/received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_REFUND_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefundReceived(
    @Body() events: WebhookPayload<PixRefundData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeRefundReceived(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'REFUND_RECEIVED',
      normalized,
      request,
    );
  }

  @Post('refund/cleared')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_REFUND_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefundCleared(
    @Body() events: WebhookPayload<PixRefundData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeRefundCleared(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'REFUND_CLEARED',
      normalized,
      request,
    );
  }

  @Post('qrcode/created')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'PIX_QRCODE_WAS_CREATED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleQrCodeCreated(
    @Body() events: WebhookPayload<PixQrCodeCreatedData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeQrCodeCreated(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'QRCODE_CREATED',
      normalized,
      request,
    );
  }
}
