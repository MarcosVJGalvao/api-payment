import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BillPaymentService } from './bill-payment.service';
import { ConfirmBillPaymentDto } from './dto/confirm-bill-payment.dto';
import { QueryBillPaymentDto } from './dto/query-bill-payment.dto';
import { ApiValidateBillPayment } from './docs/api-validate-bill-payment.decorator';
import { ApiConfirmBillPayment } from './docs/api-confirm-bill-payment.decorator';
import { ApiGetBillPayment } from './docs/api-get-bill-payment.decorator';
import { ApiListBillPayments } from './docs/api-list-bill-payments.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import { RequireLoginType } from '@/financial-providers/decorators/require-login-type.decorator';
import { ProviderLoginType } from '@/financial-providers/enums/provider-login-type.enum';
import { FinancialProviderPipe } from './pipes/financial-provider.pipe';
import { RequireClientPermission } from '@/common/decorators/require-client-permission.decorator';
import type { RequestWithSession } from '@/financial-providers/hiperbanco/interfaces/request-with-session.interface';

@ApiTags('Bill Payments')
@Controller('bill-payment')
@UseGuards(ProviderAuthGuard)
@RequireLoginType(ProviderLoginType.BANK)
@RequireClientPermission('financial:bill-payment')
export class BillPaymentController {
  constructor(private readonly billPaymentService: BillPaymentService) {}

  @Patch(':provider/validate/:digitable')
  @ApiValidateBillPayment()
  async validateBill(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Param('digitable') digitable: string,
    @Req() req: RequestWithSession,
  ) {
    return this.billPaymentService.validateBill(
      provider,
      digitable,
      req.providerSession,
    );
  }

  @Post(':provider/confirm')
  @ApiConfirmBillPayment()
  @Audit({
    action: AuditAction.BILL_PAYMENT_CONFIRMED,
    entityType: 'BillPayment',
    description: 'Pagamento de conta confirmado',
    captureNewValues: true,
  })
  async confirmPayment(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: RequestWithSession,
    @Body() dto: ConfirmBillPaymentDto,
  ) {
    return this.billPaymentService.confirmPayment(
      provider,
      dto,
      req.providerSession,
      req.clientId!,
      req.accountId!,
    );
  }

  @Get(':id')
  @ApiGetBillPayment()
  async getBillPayment(
    @Param('id') id: string,
    @Req() req: RequestWithSession,
  ) {
    return this.billPaymentService.findById(
      id,
      req.clientId!,
      req.accountId!,
      req.providerSession,
    );
  }

  @Get()
  @ApiListBillPayments()
  async listBillPayments(
    @Query() query: QueryBillPaymentDto,
    @Req() req: RequestWithSession,
  ) {
    return this.billPaymentService.listPayments(
      query,
      req.clientId!,
      req.accountId!,
    );
  }
}
