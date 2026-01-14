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
import { BillPaymentWebhookService } from '../services/bill-payment-webhook.service';
import { WebhookPublicKeyGuard } from '../guards/webhook-public-key.guard';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BillPaymentWebhookData } from '../interfaces/bill-payment-webhook.interface';

@ApiTags('Webhooks - BillPayment')
@Controller('webhook/:provider/payment')
@UseGuards(WebhookPublicKeyGuard)
export class BillPaymentWebhookController {
  constructor(
    private readonly billPaymentWebhookService: BillPaymentWebhookService,
  ) {}

  @Post('received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleReceived(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.billPaymentWebhookService.handleReceived(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('created')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CREATED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCreated(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.billPaymentWebhookService.handleCreated(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('confirmed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CONFIRMED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleConfirmed(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.billPaymentWebhookService.handleConfirmed(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BILL_PAYMENT_HAS_FAILED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleFailed(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.billPaymentWebhookService.handleFailed(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('cancelled')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_CANCELLED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCancelled(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.billPaymentWebhookService.handleCancelled(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('refused')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BILL_PAYMENT_WAS_REFUSED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRefused(
    @Body() events: WebhookPayload<BillPaymentWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.billPaymentWebhookService.handleRefused(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }
}
