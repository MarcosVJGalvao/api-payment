import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TedService } from './ted.service';
import { CreateTedDto } from './dto/create-ted.dto';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import { RequireLoginType } from '@/financial-providers/decorators/require-login-type.decorator';
import { ProviderLoginType } from '@/financial-providers/enums/provider-login-type.enum';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { RequestWithSession } from '@/financial-providers/hiperbanco/interfaces/request-with-session.interface';
import { RequireClientPermission } from '@/common/decorators/require-client-permission.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { ApiTedTransfer } from './docs/api-ted-transfer.decorator';
import { ApiListTedTransfers } from './docs/api-list-ted-transfers.decorator';
import { ApiGetTedTransfer } from './docs/api-get-ted-transfer.decorator';

@ApiTags('TED')
@Controller('ted')
@UseGuards(ProviderAuthGuard)
@ApiBearerAuth('provider-auth')
@RequireLoginType(ProviderLoginType.BANK)
@RequireClientPermission('financial:ted')
export class TedController {
  constructor(private readonly tedService: TedService) {}

  @Get(':provider/transfers')
  @ApiListTedTransfers()
  async findAll(
    @Param('provider', FinancialProviderPipe) _provider: FinancialProvider,
    @Req() req: RequestWithSession,
    @Query() query: Record<string, unknown>,
  ) {
    return this.tedService.findAll(query, req.accountId!);
  }

  @Get(':provider/transfers/:id')
  @ApiGetTedTransfer()
  async findOne(
    @Param('provider', FinancialProviderPipe) _provider: FinancialProvider,
    @Param('id') id: string,
    @Req() req: RequestWithSession,
  ) {
    return this.tedService.findOne(id, req.accountId!, req.providerSession);
  }

  @Post(':provider/transfer')
  @ApiTedTransfer()
  @Audit({
    action: AuditAction.TED_TRANSFER_CREATED,
    entityType: 'TedTransfer',
    description: 'Transferência TED realizada',
    captureNewValues: true,
  })
  async createTransfer(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Body() createTedDto: CreateTedDto,
    @Req() req: RequestWithSession,
  ) {
    return await this.tedService.createTransfer(
      provider,
      createTedDto,
      req.clientId!,
      req.accountId!,
      req.providerSession,
    );
  }
}
