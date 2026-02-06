import { Injectable } from '@nestjs/common';
import { CreateBoletoDto } from '../dto/create-boleto.dto';
import { Boleto } from '../entities/boleto.entity';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import { BoletoProviderRegistry } from '@/financial-providers/registry/boleto-provider.registry';
import {
  BoletoEmissionResponse,
  BoletoGetDataResponse,
  BoletoCancelResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';

/**
 * Helper responsável por rotear requisições de boleto para o provedor correto.
 */
@Injectable()
export class BoletoProviderHelper {
  constructor(private readonly registry: BoletoProviderRegistry) {}

  /**
   * Emite um boleto no provedor especificado.
   * @param provider - Provedor financeiro
   * @param dto - Dados do boleto a ser emitido
   * @param session - Sessão autenticada do provedor
   * @returns Resposta da emissão do boleto
   */
  async emitBoleto(
    provider: FinancialProvider,
    dto: CreateBoletoDto,
    session: ProviderSession,
  ): Promise<BoletoEmissionResponse> {
    return this.registry.get(provider).emitBoleto(dto, session);
  }

  /**
   * Busca os detalhes de um boleto no provedor especificado.
   * @param provider - Provedor financeiro
   * @param authenticationCode - Código de autenticação do boleto
   * @param accountBranch - Agência da conta
   * @param accountNumber - Número da conta
   * @param session - Sessão autenticada do provedor
   * @returns Resposta com dados detalhados do boleto
   */
  async getBoletoData(
    provider: FinancialProvider,
    authenticationCode: string,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<BoletoGetDataResponse> {
    return this.registry
      .get(provider)
      .getBoletoData(authenticationCode, accountBranch, accountNumber, session);
  }

  /**
   * Cancela um boleto no provedor especificado.
   * @param provider - Provedor financeiro
   * @param boleto - Entidade do boleto a ser cancelado
   * @param session - Sessão autenticada do provedor
   * @returns Resposta do cancelamento do boleto
   */
  async cancelBoleto(
    provider: FinancialProvider,
    boleto: Boleto,
    session: ProviderSession,
  ): Promise<BoletoCancelResponse> {
    return this.registry.get(provider).cancelBoleto(boleto, session);
  }
}
