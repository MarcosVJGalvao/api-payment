import { Injectable, Logger } from '@nestjs/common';
import { HiperbancoHttpService } from '@/financial-providers/hiperbanco/hiperbanco-http.service';
import { HiperbancoEndpoint } from '@/financial-providers/hiperbanco/enums/hiperbanco-endpoint.enum';
import { ITedTransferRequest } from '@/ted/interfaces/ted-transfer-request.interface';
import { handleHiperbancoError } from '@/financial-providers/hiperbanco/helpers/hiperbanco-error.helper';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { instanceToPlain } from 'class-transformer';

export interface HiperbancoTedResponse {
  authenticationCode: string;
  transactionId: string;
}

export interface HiperbancoTedStatusResponse {
  companyKey: string;
  authenticationCode: string;
  amount: number;
  description: string;
  correlationId: string;
  sender: {
    document: string;
    name: string;
    account: {
      branch: string;
      number: string;
      bank: {
        ispb: string;
        name: string;
        compe: string;
      };
    };
  };
  recipient: {
    document: string;
    name: string;
    account: {
      branch: string;
      number: string;
      bank: {
        ispb: string;
        name: string;
        compe: string;
      };
    };
  };
  channel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class HiperbancoTedHelper {
  private readonly logger = new Logger(HiperbancoTedHelper.name);

  constructor(private readonly hiperbancoHttpService: HiperbancoHttpService) {}

  /**
   * Realiza uma transferência via TED no Hiperbanco.
   * @param transferRequest Dados da transferência
   * @param session Sessão autenticada do provedor (já validada pelo guard)
   */
  async createTransfer(
    transferRequest: ITedTransferRequest,
    session: ProviderSession,
  ): Promise<HiperbancoTedResponse> {
    try {
      const response =
        await this.hiperbancoHttpService.post<HiperbancoTedResponse>(
          HiperbancoEndpoint.TED_TRANSFER,
          instanceToPlain(transferRequest),
          {
            headers: {
              Authorization: `Bearer ${session.hiperbancoToken}`,
            },
          },
        );
      return response;
    } catch (error) {
      handleHiperbancoError(error, () => {
        this.logger.error('Error creating TED transfer');
      });
      throw error;
    }
  }

  /**
   * Consulta o status de uma TED pelo código de autenticação (Polling).
   * @param authenticationCode Código de autenticação da transação
   * @param branchNumber Agência da conta de origem
   * @param accountNumber Número da conta de origem
   * @param session Sessão autenticada do provedor (já validada pelo guard)
   */
  async getTransferStatus(
    authenticationCode: string,
    branchNumber: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<HiperbancoTedStatusResponse> {
    try {
      const url = `${HiperbancoEndpoint.TED_STATUS}/${authenticationCode}/${branchNumber}/${accountNumber}`;
      const response =
        await this.hiperbancoHttpService.get<HiperbancoTedStatusResponse>(url, {
          headers: {
            Authorization: `Bearer ${session.hiperbancoToken}`,
          },
        });
      return response;
    } catch (error) {
      handleHiperbancoError(error, () => {
        this.logger.error('Error fetching TED status');
      });
      throw error;
    }
  }
}
