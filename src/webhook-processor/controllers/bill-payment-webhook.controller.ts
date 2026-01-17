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
import type { BillPaymentWebhookJob } from '../processors/bill-payment-webhook.processor';
import { enqueueWebhookEvent } from '../helpers/enqueue-webhook.helper';

@ApiTags('Webhooks - BillPayment')
@Controller('webhook/:provider/payment')
@UseGuards(WebhookPublicKeyGuard)
export class BillPaymentWebhookController {
  constructor(
    @InjectQueue('webhook-bill-payment')
    private readonly webhookQueue: Queue<BillPaymentWebhookJob>,
  ) {}

  @Post('received')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleReceived(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'RECEIVED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CREATED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CONFIRMED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'FAILED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CANCELLED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'REFUSED',
      events,
      request,
    );
  }
}
