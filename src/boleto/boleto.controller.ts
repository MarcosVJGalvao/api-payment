import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { CancelBoletoDto } from './dto/cancel-boleto.dto';
import { QueryBoletoDto } from './dto/query-boleto.dto';
import { ApiCreateBoleto } from './docs/api-create-boleto.decorator';
import { ApiGetBoleto } from './docs/api-get-boleto.decorator';
import { ApiListBoletos } from './docs/api-list-boletos.decorator';
import { ApiCancelBoleto } from './docs/api-cancel-boleto.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import { RequireLoginType } from '@/financial-providers/decorators/require-login-type.decorator';
import { ProviderLoginType } from '@/financial-providers/enums/provider-login-type.enum';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import { RequireClientPermission } from '@/common/decorators/require-client-permission.decorator';
import type { RequestWithSession } from '@/financial-providers/hiperbanco/interfaces/request-with-session.interface';

@ApiTags('Boletos')
@Controller('boleto')
@UseGuards(ProviderAuthGuard)
@ApiBearerAuth('provider-auth')
@RequireLoginType(ProviderLoginType.BANK)
@RequireClientPermission('financial:boleto')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

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
  async getBoleto(@Param('id') id: string, @Req() req: RequestWithSession) {
    return this.boletoService.findById(
      id,
      req.clientId!,
      req.accountId!,
      req.providerSession,
    );
  }

  @Get()
  @ApiListBoletos()
  async listBoletos(
    @Query() query: QueryBoletoDto,
    @Req() req: RequestWithSession,
  ) {
    return this.boletoService.listBoletos(query, req.clientId!, req.accountId!);
  }

  @Delete(':provider/:id')
  @ApiCancelBoleto()
  @Audit({
    action: AuditAction.BOLETO_CANCELLED,
    entityType: 'Boleto',
    description: 'Boleto cancelado',
    captureNewValues: true,
  })
  async cancelBoleto(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Param('id') id: string,
    @Req() req: RequestWithSession,
    @Body() dto: CancelBoletoDto,
  ) {
    return this.boletoService.cancelBoleto(
      id,
      provider,
      dto,
      req.providerSession,
    );
  }
}
