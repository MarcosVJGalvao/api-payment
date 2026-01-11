import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { InternalAuthGuard } from '@/internal-user/guards/internal-auth.guard';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import { ApiListWebhooksFromProvider } from './docs/api-list-webhooks-from-provider.decorator';

@ApiTags('Webhooks (Internal)')
@Controller('internal/webhook')
@ApiBearerAuth('internal-auth')
@UseGuards(InternalAuthGuard)
export class WebhookInternalController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get(':provider')
  @ApiListWebhooksFromProvider()
  async listWebhooksFromProvider(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Query() query: ListWebhooksQueryDto,
  ) {
    return this.webhookService.listWebhooksFromProvider(provider, query);
  }
}
