import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { BoletoProvider } from '@/financial-providers/contracts/boleto.provider';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import type { CreateBoletoDto } from '@/boleto/dto/create-boleto.dto';
import type { Boleto } from '@/boleto/entities/boleto.entity';
import type {
  BoletoCancelResponse,
  BoletoEmissionResponse,
  BoletoGetDataResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { HiperbancoBoletoHelper } from '@/boleto/helpers/hiperbanco/hiperbanco-boleto.helper';

@Injectable()
export class HiperbancoBoletoProvider implements BoletoProvider {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  constructor(private readonly helper: HiperbancoBoletoHelper) {}

  emitBoleto(
    dto: CreateBoletoDto,
    session: ProviderSession,
  ): Promise<BoletoEmissionResponse> {
    return this.helper.emitBoleto(dto, session);
  }

  getBoletoData(
    authenticationCode: string,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<BoletoGetDataResponse> {
    return this.helper.getBoletoData(
      authenticationCode,
      accountBranch,
      accountNumber,
      session,
    );
  }

  cancelBoleto(
    boleto: Boleto,
    session: ProviderSession,
  ): Promise<BoletoCancelResponse> {
    return this.helper.cancelBoleto(
      {
        authenticationCode: boleto.authenticationCode!,
        accountNumber: boleto.accountNumber,
        accountBranch: boleto.accountBranch,
      },
      session,
    );
  }
}
