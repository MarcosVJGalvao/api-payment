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
import {
  enqueueWebhookEvent,
  WebhookJobBase,
} from '../helpers/enqueue-webhook.helper';
import { BillPaymentWebhookNormalizerRegistry } from '../registries/bill-payment-webhook-normalizer.registry';
import { parseFinancialProvider } from '../helpers/provider-slug.helper';
import { isRecord } from '@/common/errors/helpers/type.helpers';

@ApiTags('Webhooks - BillPayment')
@Controller('webhook/:provider/payment')
@UseGuards(WebhookPublicKeyGuard)
export class BillPaymentWebhookController {
  constructor(
    @InjectQueue('webhook-bill-payment')
    private readonly webhookQueue: Queue<WebhookJobBase>,
    private readonly normalizerRegistry: BillPaymentWebhookNormalizerRegistry,
  ) {}

  private getProvider(request: Request) {
    return parseFinancialProvider(String(request.params?.provider || ''));
  }

  private getHeaders(request: Request): Record<string, unknown> {
    return isRecord(request.headers) ? request.headers : {};
  }

  @Post('received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleReceived(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeReceived(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'RECEIVED',
      normalized,
      request,
    );
  }

  @Post('created')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CREATED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCreated(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeCreated(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CREATED',
      normalized,
      request,
    );
  }

  @Post('confirmed')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CONFIRMED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleConfirmed(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeConfirmed(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CONFIRMED',
      normalized,
      request,
    );
  }

  @Post('failed')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_HAS_FAILED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleFailed(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeFailed(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'FAILED',
      normalized,
      request,
    );
  }

  @Post('cancelled')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CANCELLED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCancelled(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
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

  @Post('refused')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_REFUSED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefused(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    const provider = this.getProvider(request);
    const headers = this.getHeaders(request);
    const normalized = this.normalizerRegistry
      .get(provider)
      .normalizeRefused(events, headers);
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'REFUSED',
      normalized,
      request,
    );
  }
}
