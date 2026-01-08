import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Patch,
    Query,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { QueryBoletoDto } from './dto/query-boleto.dto';
import { ApiCreateBoleto } from './docs/api-create-boleto.decorator';
import { ApiGetBoleto } from './docs/api-get-boleto.decorator';
import { ApiListBoletos } from './docs/api-list-boletos.decorator';
import { ApiUpdateBoleto } from './docs/api-update-boleto.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import { RequireLoginType } from '@/financial-providers/decorators/require-login-type.decorator';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { FinancialProviderPipe } from './pipes/financial-provider.pipe';
import type { BoletoWebhookPayload } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { AppLoggerService } from '@/common/logger/logger.service';

interface RequestWithSession extends Request {
    providerSession: ProviderSession;
}

@ApiTags('Boletos')
@Controller('boleto')
export class BoletoController {
    private readonly context = BoletoController.name;

    constructor(
        private readonly boletoService: BoletoService,
        private readonly logger: AppLoggerService,
    ) { }

    @Post(':provider')
    @UseGuards(ProviderAuthGuard)
    @RequireLoginType('bank')
    @ApiCreateBoleto()
    @Audit({
        action: AuditAction.BOLETO_CREATED,
        entityType: 'Boleto',
        description: 'Boleto emitido',
        captureNewValues: true,
    })
    async createBoleto(
        @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
        @Req() req: RequestWithSession,
        @Body() dto: CreateBoletoDto,
    ) {
        return this.boletoService.createBoleto(provider, dto, req.providerSession);
    }

    @Get(':id')
    @ApiGetBoleto()
    async getBoleto(@Param('id') id: string) {
        return this.boletoService.findById(id);
    }

    @Get()
    @ApiListBoletos()
    async listBoletos(@Query() query: QueryBoletoDto) {
        return this.boletoService.listBoletos(query);
    }

    @Patch(':id')
    @UseGuards(ProviderAuthGuard)
    @ApiUpdateBoleto()
    @Audit({
        action: AuditAction.BOLETO_UPDATED,
        entityType: 'Boleto',
        description: 'Boleto atualizado',
        captureNewValues: true,
        captureOldValues: true,
    })
    async updateBoleto(
        @Param('id') id: string,
        @Body() dto: UpdateBoletoDto,
    ) {
        await this.boletoService.updateBoleto(id, dto);
        return { message: 'Boleto atualizado com sucesso' };
    }

    @Post('webhook/hiperbanco')
    @HttpCode(HttpStatus.OK)
    async webhookHiperbanco(@Body() payload: BoletoWebhookPayload) {
        this.logger.log('Received webhook from Hiperbanco', this.context);
        
        try {
            await this.boletoService.processWebhookUpdate(payload);
            return { message: 'Webhook processado com sucesso' };
        } catch (error) {
            // Logar erro mas não lançar exceção para não fazer o Hiperbanco retentar
            this.logger.error(
                `Failed to process webhook: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error.stack : undefined,
                this.context,
            );
            return { message: 'Webhook recebido' };
        }
    }
}
