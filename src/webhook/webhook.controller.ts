import { Body, Controller, Param, Post, ParseEnumPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { ApiRegisterWebhook } from './docs/api-register-webhook.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import { RequireLoginType } from '@/financial-providers/decorators/require-login-type.decorator';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';

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
        @Param('provider', new ParseEnumPipe(FinancialProvider)) provider: FinancialProvider,
        @Req() req: RequestWithSession,
        @Body() dto: RegisterWebhookDto,
    ) {
        return this.webhookService.registerWebhook(provider, dto, req.providerSession);
    }
}
