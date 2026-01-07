import { Body, Controller, Get, Param, Post, Patch, Delete, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import { ApiRegisterWebhook } from './docs/api-register-webhook.decorator';
import { ApiListWebhooks } from './docs/api-list-webhooks.decorator';
import { ApiUpdateWebhook } from './docs/api-update-webhook.decorator';
import { ApiDeleteWebhook } from './docs/api-delete-webhook.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import { RequireLoginType } from '@/financial-providers/decorators/require-login-type.decorator';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { FinancialProviderPipe } from './pipes/financial-provider.pipe';

interface RequestWithSession extends Request {
    providerSession: ProviderSession;
}

@ApiTags('Webhooks')
@Controller('webhook')
@ApiBearerAuth()
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) { }

    @Post(':provider/register')
    @UseGuards(ProviderAuthGuard)
    @RequireLoginType('backoffice')
    @ApiRegisterWebhook()
    @Audit({
        action: AuditAction.WEBHOOK_REGISTERED,
        entityType: 'Webhook',
        description: 'Webhook registrado',
        captureNewValues: true,
    })
    async registerWebhook(
        @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
        @Req() req: RequestWithSession,
        @Body() dto: RegisterWebhookDto,
    ) {
        return this.webhookService.registerWebhook(provider, dto, req.providerSession);
    }

    @Get(':provider')
    @UseGuards(ProviderAuthGuard)
    @RequireLoginType('backoffice')
    @ApiListWebhooks()
    async listWebhooks(
        @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
        @Req() req: RequestWithSession,
        @Query() query: ListWebhooksQueryDto,
    ) {
        return this.webhookService.listWebhooks(provider, query, req.providerSession);
    }

    @Patch(':provider/:id')
    @UseGuards(ProviderAuthGuard)
    @RequireLoginType('backoffice')
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
        @Req() req: RequestWithSession,
        @Body() dto: UpdateWebhookDto,
    ) {
        return this.webhookService.updateWebhook(provider, webhookId, dto, req.providerSession);
    }

    @Delete(':provider/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(ProviderAuthGuard)
    @RequireLoginType('backoffice')
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
        @Req() req: RequestWithSession,
    ) {
        return this.webhookService.deleteWebhook(provider, webhookId, req.providerSession);
    }
}
