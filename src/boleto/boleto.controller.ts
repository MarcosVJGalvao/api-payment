import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { QueryBoletoDto } from './dto/query-boleto.dto';
import { ApiCreateBoleto } from './docs/api-create-boleto.decorator';
import { ApiGetBoleto } from './docs/api-get-boleto.decorator';
import { ApiListBoletos } from './docs/api-list-boletos.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import { RequireLoginType } from '@/financial-providers/decorators/require-login-type.decorator';
import { FinancialProviderPipe } from './pipes/financial-provider.pipe';
import { RequireClientPermission } from '@/common/decorators/require-client-permission.decorator';
import type { RequestWithSession } from '@/financial-providers/hiperbanco/interfaces/request-with-session.interface';

@ApiTags('Boletos')
@Controller('boleto')
@UseGuards(ProviderAuthGuard)
@RequireLoginType('bank')
@RequireClientPermission('financial:boleto')
export class BoletoController {
    constructor(
        private readonly boletoService: BoletoService,
    ) { }

    @Post(':provider')
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
    async getBoleto(
        @Param('id') id: string,
        @Req() req: RequestWithSession,
    ) {
        return this.boletoService.findById(id, req.clientId!, req.accountId!);
    }

    @Get()
    @ApiListBoletos()
    async listBoletos(
        @Query() query: QueryBoletoDto,
        @Req() req: RequestWithSession,
    ) {
        return this.boletoService.listBoletos(query, req.clientId!, req.accountId!);
    }
}
