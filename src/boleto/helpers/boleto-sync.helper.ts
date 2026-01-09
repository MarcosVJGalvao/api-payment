import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '@/common/logger/logger.service';
import { Boleto } from '../entities/boleto.entity';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { BoletoProviderHelper } from './boleto-provider.helper';
import { BoletoGetDataResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { parseBoletoStatus } from './boleto-validation.helper';

/**
 * Helper responsável pela sincronização de dados de boletos com provedores externos.
 */
@Injectable()
export class BoletoSyncHelper {
  private readonly context = BoletoSyncHelper.name;

  constructor(
    @InjectRepository(Boleto)
    private readonly repository: Repository<Boleto>,
    private readonly providerHelper: BoletoProviderHelper,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Sincroniza os dados de um boleto com o provedor financeiro (atualmente apenas Hiperbanco).
   * Se houver sucesso, persiste as alterações no banco de dados e retorna o boleto atualizado.
   * Caso contrário, retorna o boleto original.
   * @param boleto - Entidade do boleto a ser sincronizado
   * @param session - Sessão do provedor
   * @returns Boleto atualizado (ou original em caso de erro/pular)
   */
  async syncBoletoWithProvider(
    boleto: Boleto,
    session: ProviderSession,
  ): Promise<Boleto> {
    // Atualmente sincronizamos apenas boletos do Hiperbanco que possuem authenticationCode
    if (
      boleto.providerSlug !== FinancialProvider.HIPERBANCO ||
      !boleto.authenticationCode
    ) {
      return boleto;
    }

    try {
      this.logger.log(
        `Fetching updated boleto data from Hiperbanco for boleto: ${boleto.id}`,
        this.context,
      );

      const boletoData: BoletoGetDataResponse =
        await this.providerHelper.getBoletoData(
          boleto.providerSlug,
          boleto.authenticationCode,
          boleto.accountBranch,
          boleto.accountNumber,
          session,
        );

      // Preparar objeto com campos a serem atualizados
      const updateData: Partial<Boleto> = {};

      // Atualizar barcode (sempre atualizar se presente na resposta)
      if (boletoData.barcode !== undefined) {
        updateData.barcode = boletoData.barcode;
      }

      // Atualizar digitable (sempre atualizar se presente na resposta)
      if (boletoData.digitable !== undefined) {
        updateData.digitable = boletoData.digitable;
      }

      // Atualizar status (sempre atualizar se presente - status é obrigatório na resposta)
      if (boletoData.status) {
        updateData.status = parseBoletoStatus(boletoData.status);
      }

      // Atualizar ourNumber (sempre atualizar se presente na resposta)
      if (boletoData.ourNumber !== undefined) {
        updateData.ourNumber = boletoData.ourNumber;
      }

      // Atualizar payments (sempre atualizar quando presente, mesmo que seja null ou array vazio)
      if (boletoData.payments !== undefined) {
        updateData.payments = boletoData.payments;
      }

      // Atualizar no banco de dados usando update() para garantir persistência
      if (Object.keys(updateData).length > 0) {
        await this.repository.update(boleto.id, updateData);

        // Buscar o boleto atualizado para retornar
        const updatedBoleto = await this.repository.findOne({
          where: { id: boleto.id },
        });
        if (updatedBoleto) {
          this.logger.log(
            `Boleto data persisted from Hiperbanco: ${boleto.id}`,
            this.context,
          );
          return updatedBoleto;
        }
      }
    } catch (error) {
      // Logar erro completo mas não falhar a busca - retornar boleto do banco mesmo assim
      this.logger.error(
        `Failed to fetch or persist updated boleto data from Hiperbanco: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        this.context,
      );
    }

    return boleto;
  }
}
