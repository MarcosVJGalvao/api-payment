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
  TedCashOutData,
  TedCashInData,
  TedRefundData,
} from '../interfaces/ted-webhook.interface';
import {
  enqueueWebhookEvent,
  WebhookJobBase,
} from '../helpers/enqueue-webhook.helper';
import { TedWebhookNormalizerRegistry } from '../registries/ted-webhook-normalizer.registry';
import { parseFinancialProvider } from '../helpers/provider-slug.helper';
import { isRecord } from '@/common/errors/helpers/type.helpers';

@ApiTags('Webhooks - TED')
@Controller('webhook/:provider/ted')
@UseGuards(WebhookPublicKeyGuard)
export class TedWebhookController {
  constructor(
    @InjectQueue('webhook-ted')
    private readonly webhookQueue: Queue<WebhookJobBase>,
    private readonly normalizerRegistry: TedWebhookNormalizerRegistry,
  ) {}

  private getProvider(request: Request) {
    return parseFinancialProvider(String(request.params?.provider || ''));
  }

  private getHeaders(request: Request): Record<string, unknown> {
    return isRecord(request.headers) ? request.headers : {};
  }

  // ============ Cash-Out Webhooks ============

  @Post('cash-out/approved')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'TED_CASH_OUT_WAS_APPROVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutApproved(
    @Body() events: WebhookPayload<TedCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCashOutApproved(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_APPROVED',
      normalized,
      request,
    );
  }

  @Post('cash-out/done')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'TED_CASH_OUT_WAS_DONE' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutDone(
    @Body() events: WebhookPayload<TedCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCashOutDone(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_DONE',
      normalized,
      request,
    );
  }

  @Post('cash-out/canceled')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'TED_CASH_OUT_WAS_CANCELED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutCanceled(
    @Body() events: WebhookPayload<TedCashOutData>[],
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

  @Post('cash-out/reproved')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'TED_CASH_OUT_WAS_REPROVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutReproved(
    @Body() events: WebhookPayload<TedCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCashOutReproved(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_REPROVED',
      normalized,
      request,
    );
  }

  @Post('cash-out/undone')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'TED_CASH_OUT_WAS_UNDONE' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutUndone(
    @Body() events: WebhookPayload<TedCashOutData>[],
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

  // ============ Cash-In Webhooks ============

  @Post('cash-in/received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'TED_CASH_IN_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInReceived(
    @Body() events: WebhookPayload<TedCashInData>[],
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
  @ApiOperation({ summary: 'TED_CASH_IN_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInCleared(
    @Body() events: WebhookPayload<TedCashInData>[],
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

  // ============ Refund Webhooks ============

  @Post('refund/received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'TED_REFUND_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefundReceived(
    @Body() events: WebhookPayload<TedRefundData>[],
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
  @ApiOperation({ summary: 'TED_REFUND_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefundCleared(
    @Body() events: WebhookPayload<TedRefundData>[],
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
}
