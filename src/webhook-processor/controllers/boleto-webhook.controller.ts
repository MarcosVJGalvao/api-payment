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
import { BoletoWebhookService } from '../services/boleto-webhook.service';
import { WebhookPublicKeyGuard } from '../guards/webhook-public-key.guard';
import { WebhookPayload } from '../interfaces/webhook-base.interface';
import { BoletoWebhookData } from '../interfaces/boleto-webhook.interface';

@ApiTags('Webhooks - Boleto')
@Controller('webhook/:provider/boleto')
@UseGuards(WebhookPublicKeyGuard)
export class BoletoWebhookController {
  constructor(private readonly boletoWebhookService: BoletoWebhookService) {}

  @Post('registered')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BOLETO_WAS_REGISTERED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleRegistered(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.boletoWebhookService.handleRegistered(
      events,
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('cash-in/received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BOLETO_CASH_IN_WAS_RECEIVED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInReceived(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.boletoWebhookService.handleCashInReceived(
      events,
      request.webhookClientId || '',
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('cash-in/cleared')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BOLETO_CASH_IN_WAS_CLEARED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCashInCleared(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.boletoWebhookService.handleCashInCleared(
      events,
      request.validPublicKey || false,
    );
    return { received: true };
  }

  @Post('cancelled')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BOLETO_WAS_CANCELLED' })
  @ApiParam({ name: 'provider', description: 'Provedor financeiro' })
  async handleCancelled(
    @Body() events: WebhookPayload<BoletoWebhookData>[],
    @Req() request: Request,
  ): Promise<{ received: boolean }> {
    await this.boletoWebhookService.handleCancelled(
      events,
      request.validPublicKey || false,
    );
    return { received: true };
  }
}
