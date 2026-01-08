import { Body, Controller, Get, Param, Post, UseInterceptors, ParseEnumPipe, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { FinancialCredentialsService } from './services/financial-credentials.service';
import { HiperbancoAuthService } from './hiperbanco/hiperbanco-auth.service';
import { CreateProviderCredentialDto } from './dto/create-provider-credential.dto';
import { BankLoginDto } from './dto/bank-login.dto';
import { BackofficeLoginDto } from './dto/backoffice-login.dto';
import { ProviderCredential } from './entities/provider-credential.entity';
import { ApiConfigureProvider } from './docs/api-configure-provider.decorator';
import { ApiGetProviderConfig } from './docs/api-get-provider-config.decorator';
import { ApiBackofficeLogin } from './docs/api-backoffice-login.decorator';
import { ApiBankLogin } from './docs/api-bank-login.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { AuditInterceptor } from '@/common/audit/interceptors/audit.interceptor';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { RequireClient } from '@/common/decorators/require-client.decorator';
import { RequireClientPermission } from '@/common/decorators/require-client-permission.decorator';
import type { RequestWithClient } from '@/common/guards/client.guard';

@ApiTags('Provedores Financeiros')
@Controller('providers')
@UseInterceptors(AuditInterceptor)
export class FinancialProvidersController {
    constructor(
        private readonly credentialsService: FinancialCredentialsService,
        private readonly hiperbancoAuth: HiperbancoAuthService,
    ) { }

    @Post(':provider/config')
    @ApiConfigureProvider()
    @Audit({
        action: AuditAction.PROVIDER_CREDENTIAL_CREATED,
        entityType: 'ProviderCredential',
        description: 'Provider credential configured',
        captureNewValues: true,
        ignoreFields: ['password'],
    })
    async configureProvider(
        @Param('provider', new ParseEnumPipe(FinancialProvider)) provider: FinancialProvider,
        @Body() dto: CreateProviderCredentialDto,
    ): Promise<ProviderCredential> {
        return this.credentialsService.saveCredentials(provider, dto);
    }

    @Get(':provider/config')
    @ApiGetProviderConfig()
    async getConfig(
        @Param('provider', new ParseEnumPipe(FinancialProvider)) provider: FinancialProvider,
    ): Promise<ProviderCredential> {
        return this.credentialsService.getPublicCredentials(provider);
    }

    @Post('hiperbanco/auth/backoffice')
    @ApiBackofficeLogin()
    async loginBackoffice(@Body() dto: BackofficeLoginDto) {
        return this.hiperbancoAuth.loginBackoffice(dto);
    }

    @Post('hiperbanco/auth/bank')
    @RequireClient()
    @RequireClientPermission('auth:bank')
    @ApiBankLogin()
    async loginBank(@Body() dto: BankLoginDto, @Req() req: RequestWithClient) {
        return this.hiperbancoAuth.loginApiBank(dto, req.clientId!);
    }
}
