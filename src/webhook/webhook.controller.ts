import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ApiRegisterWebhook } from './docs/api-register-webhook.decorator';
import { ApiListWebhooks } from './docs/api-list-webhooks.decorator';
import { ApiUpdateWebhook } from './docs/api-update-webhook.decorator';
import { ApiDeleteWebhook } from './docs/api-delete-webhook.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { BackofficeAuthGuard } from '@/backoffice-user/guards/backoffice-auth.guard';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import { RequireClientPermission } from '@/common/decorators/require-client-permission.decorator';

@ApiTags('Webhooks')
@Controller('webhook')
@ApiBearerAuth('backoffice-auth')
@ApiHeader({
  name: 'X-Client-Id',
  description: 'ID do cliente',
  required: true,
  schema: { type: 'string' },
})
@RequireClientPermission('integration:webhook')
@UseGuards(BackofficeAuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post(':provider/register')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiRegisterWebhook()
  @Audit({
    action: AuditAction.WEBHOOK_REGISTERED,
    entityType: 'Webhook',
    description: 'Webhook registrado',
    captureNewValues: true,
  })
  async registerWebhook(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: any,
    @Body() dto: RegisterWebhookDto,
  ) {
    return this.webhookService.registerWebhook(
      provider,
      dto,
      String(req.user.clientId),
    );
  }

  @Get(':provider')
  @ApiListWebhooks()
  async listWebhooks(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: any,
  ) {
    return this.webhookService.listWebhooks(
      provider,
      String(req.user.clientId),
    );
  }

  @Patch(':provider/:id')
  @ApiUpdateWebhook()
  @Audit({
    action: AuditAction.WEBHOOK_UPDATED,
    entityType: 'Webhook',
    description: 'Webhook atualizado',
    captureNewValues: true,
    captureOldValues: true,
  })
  async updateWebhook(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Param('id') webhookId: string,
    @Req() req: any,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhookService.updateWebhook(
      provider,
      webhookId,
      dto,
      String(req.user.clientId),
    );
  }

  @Delete(':provider/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteWebhook()
  @Audit({
    action: AuditAction.WEBHOOK_DELETED,
    entityType: 'Webhook',
    description: 'Webhook removido',
    captureOldValues: true,
  })
  async deleteWebhook(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Param('id') webhookId: string,
    @Req() req: any,
  ) {
    return this.webhookService.deleteWebhook(
      provider,
      webhookId,
      String(req.user.clientId),
    );
  }
}
