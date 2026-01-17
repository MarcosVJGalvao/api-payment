import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PixService } from './pix.service';
import { RegisterPixKeyDto } from './dto/register-pix-key.dto';
import { GenerateTotpDto } from './dto/generate-totp.dto';
import { DeletePixKeyParamsDto } from './dto/delete-pix-key-params.dto';
import { ValidatePixKeyParamsDto } from './dto/validate-pix-key-params.dto';
import { PixTransferDto } from './dto/pix-transfer.dto';
import { GenerateStaticQrCodeDto } from './dto/generate-static-qr-code.dto';
import { GenerateDynamicQrCodeDto } from './dto/generate-dynamic-qr-code.dto';
import { DecodeQrCodeDto } from './dto/decode-qr-code.dto';
import { DecodeBase64QrCodeDto } from './dto/decode-base64-qr-code.dto';
import { ApiGetPixKeys } from './docs/api-get-pix-keys.decorator';
import { ApiRegisterPixKey } from './docs/api-register-pix-key.decorator';
import { ApiDeletePixKey } from './docs/api-delete-pix-key.decorator';
import { ApiGenerateTotp } from './docs/api-generate-totp.decorator';
import { ApiValidatePixKey } from './docs/api-validate-pix-key.decorator';
import { ApiPixTransfer } from './docs/api-pix-transfer.decorator';
import { ApiGenerateStaticQrCode } from './docs/api-generate-static-qrcode.decorator';
import { ApiGenerateDynamicQrCode } from './docs/api-generate-dynamic-qrcode.decorator';
import { ApiDecodeQrCode } from './docs/api-decode-qrcode.decorator';
import { ApiDecodeBase64QrCode } from './docs/api-decode-base64-qrcode.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import { RequireLoginType } from '@/financial-providers/decorators/require-login-type.decorator';
import { ProviderLoginType } from '@/financial-providers/enums/provider-login-type.enum';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import { RequireClientPermission } from '@/common/decorators/require-client-permission.decorator';
import type { RequestWithSession } from '@/financial-providers/hiperbanco/interfaces/request-with-session.interface';

@ApiTags('PIX')
@Controller('pix')
@UseGuards(ProviderAuthGuard)
@ApiBearerAuth('provider-auth')
@RequireLoginType(ProviderLoginType.BANK)
@RequireClientPermission('financial:pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Get(':provider/keys')
  @ApiGetPixKeys()
  async getPixKeys(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: RequestWithSession,
  ) {
    return this.pixService.getPixKeys(
      provider,
      req.accountId!,
      req.providerSession,
    );
  }

  @Post(':provider/register')
  @ApiRegisterPixKey()
  @Audit({
    action: AuditAction.PIX_KEY_REGISTERED,
    entityType: 'PixKey',
    description: 'Chave PIX cadastrada',
    captureNewValues: true,
  })
  async registerPixKey(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: RequestWithSession,
    @Body() dto: RegisterPixKeyDto,
  ) {
    return this.pixService.registerPixKey(
      provider,
      dto,
      req.accountId!,
      req.providerSession,
    );
  }

  @Delete(':provider/keys/:addressKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeletePixKey()
  @Audit({
    action: AuditAction.PIX_KEY_DELETED,
    entityType: 'PixKey',
    description: 'Chave PIX excluída',
    captureNewValues: false,
  })
  async deletePixKey(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Param() params: DeletePixKeyParamsDto,
    @Req() req: RequestWithSession,
  ) {
    await this.pixService.deletePixKey(
      provider,
      params.addressKey,
      req.providerSession,
    );
  }

  @Post(':provider/totp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiGenerateTotp()
  async generateTotp(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: RequestWithSession,
    @Body() dto: GenerateTotpDto,
  ) {
    await this.pixService.generateTotpCode(provider, dto, req.providerSession);
  }

  @Get(':provider/validate/:addressingKey')
  @ApiValidatePixKey()
  async validatePixKey(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Param() params: ValidatePixKeyParamsDto,
    @Req() req: RequestWithSession,
  ) {
    return this.pixService.validatePixKey(
      provider,
      params.addressingKey,
      req.providerSession,
    );
  }

  @Post(':provider/transfer')
  @ApiPixTransfer()
  @Audit({
    action: AuditAction.PIX_TRANSFER_CREATED,
    entityType: 'PixTransfer',
    description: 'Transferência PIX realizada',
    captureNewValues: true,
  })
  async transfer(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: RequestWithSession,
    @Body() dto: PixTransferDto,
  ) {
    return this.pixService.transfer(
      provider,
      dto,
      req.accountId!,
      req.clientId!,
      req.providerSession,
    );
  }

  @Post(':provider/qrcode/static')
  @ApiGenerateStaticQrCode()
  @Audit({
    action: AuditAction.PIX_QRCODE_CREATED,
    entityType: 'PixQrCode',
    description: 'QR Code estático gerado',
    captureNewValues: true,
  })
  async generateStaticQrCode(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: RequestWithSession,
    @Body() dto: GenerateStaticQrCodeDto,
  ) {
    return this.pixService.generateStaticQrCode(
      provider,
      dto,
      req.accountId!,
      req.clientId!,
      req.providerSession,
    );
  }

  @Post(':provider/qrcode/dynamic')
  @ApiGenerateDynamicQrCode()
  @Audit({
    action: AuditAction.PIX_QRCODE_CREATED,
    entityType: 'PixQrCode',
    description: 'QR Code dinâmico gerado',
    captureNewValues: true,
  })
  async generateDynamicQrCode(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: RequestWithSession,
    @Body() dto: GenerateDynamicQrCodeDto,
  ) {
    return this.pixService.generateDynamicQrCode(
      provider,
      dto,
      req.accountId!,
      req.clientId!,
      req.providerSession,
    );
  }

  @Post(':provider/qrcode/decode')
  @ApiDecodeQrCode()
  async decodeQrCode(
    @Param('provider', FinancialProviderPipe) provider: FinancialProvider,
    @Req() req: RequestWithSession,
    @Body() dto: DecodeQrCodeDto,
  ) {
    return this.pixService.decodeQrCode(
      provider,
      dto.code,
      req.providerSession,
    );
  }

  @Post('qrcode/decode-base64')
  @ApiDecodeBase64QrCode()
  decodeBase64QrCode(@Body() dto: DecodeBase64QrCodeDto) {
    return this.pixService.decodeBase64QrCode(dto.encodedValue);
  }
}
