import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { InternalAuthGuard } from '@/internal-user/guards/internal-auth.guard';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import { ApiListWebhooksFromProvider } from './docs/api-list-webhooks-from-provider.decorator';
import { ApiControllerHideFromPortalScalar } from '@/swagger/docs/api-controller-hide-from-portal-scalar.decorator';

@ApiControllerHideFromPortalScalar('Webhooks (Internal)')
@Controller('internal/webhook')
@ApiBearerAuth('internal-auth')
@UseGuards(InternalAuthGuard)
export class WebhookInternalController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post(':provider/register')
  @HttpCode(HttpStatus.ACCEPTED)
  async registerWebhook(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Body() dto: RegisterWebhookDto,
  ) {
    return this.webhookService.registerWebhook(provider, dto);
  }

  @Get(':provider')
  @ApiListWebhooksFromProvider()
  async listWebhooksFromProvider(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Query() query: ListWebhooksQueryDto,
  ) {
    return this.webhookService.listWebhooksFromProvider(provider, query);
  }

  @Delete(':provider/all')
  @HttpCode(HttpStatus.OK)
  async deleteAllWebhooksFromProvider(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
  ) {
    return this.webhookService.deleteAllWebhooksFromProvider(provider);
  }
}
