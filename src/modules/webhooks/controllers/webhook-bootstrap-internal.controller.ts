import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InternalAuthGuard } from '@/internal-user/guards/internal-auth.guard';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderWebhookBootstrapService } from '../services/provider-webhook-bootstrap.service';
import { ApiControllerHideFromPortalScalar } from '@/swagger/docs/api-controller-hide-from-portal-scalar.decorator';

@ApiControllerHideFromPortalScalar('Webhooks (Internal)')
@ApiTags('Webhooks (Internal)')
@Controller('internal/webhook')
@ApiBearerAuth('internal-auth')
@UseGuards(InternalAuthGuard)
export class WebhookBootstrapInternalController {
  constructor(
    private readonly bootstrapService: ProviderWebhookBootstrapService,
  ) {}

  @Post(':provider/bootstrap')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar manifesto de webhooks do provedor',
    description:
      'Registra ou atualiza no provedor financeiro todos os webhooks definidos no manifesto do sistema. ' +
      'Webhooks já registrados com a URL correta são ignorados (SKIP). ' +
      'Webhooks com URL desatualizada são atualizados (UPDATE). ' +
      'Webhooks ausentes no provedor são criados e persistidos no banco (REGISTER).',
  })
  @ApiParam({
    name: 'provider',
    description: 'Provedor financeiro (ex: hiperbanco)',
    example: 'hiperbanco',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sincronização concluída',
    schema: {
      type: 'object',
      properties: {
        registered: {
          type: 'number',
          description: 'Webhooks cadastrados no provedor e no banco',
        },
        updated: { type: 'number', description: 'Webhooks com URL atualizada' },
        skipped: {
          type: 'number',
          description: 'Webhooks já corretos, sem alteração',
        },
        failed: {
          type: 'number',
          description: 'Webhooks que falharam (detalhes nos logs)',
        },
      },
    },
  })
  async syncManifest(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
  ) {
    return this.bootstrapService.syncProvider(provider);
  }
}
