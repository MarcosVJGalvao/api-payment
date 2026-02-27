import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
  ParseEnumPipe,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinancialCredentialsService } from './services/financial-credentials.service';
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
import { ProviderLoginType } from './enums/provider-login-type.enum';
import { AuthProviderRegistry } from './registry/auth-provider.registry';
import { ApiHideFromPortalScalar } from '@/swagger/docs/api-hide-from-portal-scalar.decorator';

@ApiTags('Provedores Financeiros')
@Controller('providers')
@UseInterceptors(AuditInterceptor)
export class FinancialProvidersController {
  constructor(
    private readonly credentialsService: FinancialCredentialsService,
    private readonly authProviders: AuthProviderRegistry,
  ) {}

  @Post(':provider/config')
  @ApiHideFromPortalScalar()
  @RequireClient()
  @ApiConfigureProvider()
  @Audit({
    action: AuditAction.PROVIDER_CREDENTIAL_CREATED,
    entityType: 'ProviderCredential',
    description: 'Provider credential configured',
    captureNewValues: true,
    ignoreFields: ['password'],
  })
  async configureProvider(
    @Param('provider', new ParseEnumPipe(FinancialProvider))
    provider: FinancialProvider,
    @Body() dto: CreateProviderCredentialDto,
    @Req() req: RequestWithClient,
  ): Promise<ProviderCredential> {
    return this.credentialsService.saveCredentials(
      provider,
      dto,
      req.clientId!,
    );
  }

  @Get(':provider/config/:loginType')
  @ApiHideFromPortalScalar()
  @ApiGetProviderConfig()
  async getConfig(
    @Param('provider', new ParseEnumPipe(FinancialProvider))
    provider: FinancialProvider,
    @Param('loginType', new ParseEnumPipe(ProviderLoginType))
    loginType: ProviderLoginType,
  ): Promise<ProviderCredential> {
    return this.credentialsService.getPublicCredentials(provider, loginType);
  }

  /**
   * Rotas padronizadas (plugáveis) por provedor.
   */
  @Post(':provider/auth/backoffice')
  @ApiHideFromPortalScalar()
  @ApiBackofficeLogin()
  async loginBackofficeByProvider(
    @Param('provider', new ParseEnumPipe(FinancialProvider))
    provider: FinancialProvider,
    @Body() dto: BackofficeLoginDto,
  ) {
    return this.authProviders.get(provider).loginBackoffice(dto);
  }

  @Post(':provider/auth/bank')
  @RequireClient()
  @RequireClientPermission('auth:bank')
  @ApiBearerAuth('provider-auth')
  @ApiBankLogin()
  async loginBankByProvider(
    @Param('provider', new ParseEnumPipe(FinancialProvider))
    provider: FinancialProvider,
    @Body() dto: BankLoginDto,
    @Req() req: RequestWithClient,
  ) {
    return this.authProviders.get(provider).loginBank(dto, req.clientId!);
  }
}
