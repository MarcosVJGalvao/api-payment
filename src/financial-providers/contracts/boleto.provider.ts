import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from './provider-session';
import type { CreateBoletoDto } from '@/boleto/dto/create-boleto.dto';
import type { Boleto } from '@/boleto/entities/boleto.entity';
import type {
  BoletoEmissionResponse,
  BoletoGetDataResponse,
  BoletoCancelResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';

export interface BoletoProvider {
  readonly providerSlug: FinancialProvider;

  emitBoleto(
    dto: CreateBoletoDto,
    session: ProviderSession,
  ): Promise<BoletoEmissionResponse>;

  getBoletoData(
    authenticationCode: string,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<BoletoGetDataResponse>;

  cancelBoleto(
    boleto: Boleto,
    session: ProviderSession,
  ): Promise<BoletoCancelResponse>;
}
