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
import { PixWebhookService } from '../services/pix-webhook.service';
import { WebhookPublicKeyGuard } from '../guards/webhook-public-key.guard';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import {
  PixCashInReceivedData,
  PixCashInClearedData,
  PixCashOutData,
  PixRefundData,
} from '../interfaces/pix-webhook.interface';

@ApiTags('Webhooks - PIX')
@Controller('webhook/:provider/pix')
@UseGuards(WebhookPublicKeyGuard)
export class PixWebhookController {
  constructor(private readonly pixWebhookService: PixWebhookService) {}

  @Post('cash-in/received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PIX_CASH_IN_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInReceived(
    @Body() events: WebhookPayload<PixCashInReceivedData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.pixWebhookService.handleCashInReceived(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('cash-in/cleared')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PIX_CASH_IN_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInCleared(
    @Body() events: WebhookPayload<PixCashInClearedData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.pixWebhookService.handleCashInCleared(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('cash-out/completed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_COMPLETED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutCompleted(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.pixWebhookService.handleCashOutCompleted(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('cash-out/canceled')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_CANCELED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutCanceled(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.pixWebhookService.handleCashOutCanceled(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('cash-out/undone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PIX_CASHOUT_WAS_UNDONE' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashOutUndone(
    @Body() events: WebhookPayload<PixCashOutData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.pixWebhookService.handleCashOutUndone(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('refund/received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PIX_REFUND_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefundReceived(
    @Body() events: WebhookPayload<PixRefundData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.pixWebhookService.handleRefundReceived(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('refund/cleared')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PIX_REFUND_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefundCleared(
    @Body() events: WebhookPayload<PixRefundData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.pixWebhookService.handleRefundCleared(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }
}
