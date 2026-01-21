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
import type { TedWebhookJob } from '../processors/ted-webhook.processor';
import { enqueueWebhookEvent } from '../helpers/enqueue-webhook.helper';

@ApiTags('Webhooks - TED')
@Controller('webhook/:provider/ted')
@UseGuards(WebhookPublicKeyGuard)
export class TedWebhookController {
  constructor(
    @InjectQueue('webhook-ted')
    private readonly webhookQueue: Queue<TedWebhookJob>,
  ) {}

  // ============ Cash-Out Webhooks ============

  @Post('cash-out/approved')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'TED_CASH_OUT_WAS_APPROVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutApproved(
    @Body() events: WebhookPayload<TedCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_APPROVED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_DONE',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_CANCELED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_REPROVED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_OUT_UNDONE',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_IN_RECEIVED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'CASH_IN_CLEARED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'REFUND_RECEIVED',
      events,
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
    return await enqueueWebhookEvent(
      this.webhookQueue,
      'REFUND_CLEARED',
      events,
      request,
    );
  }
}
