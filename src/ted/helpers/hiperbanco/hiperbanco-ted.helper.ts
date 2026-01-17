import { Injectable, Logger } from '@nestjs/common';
import { HiperbancoHttpService } from '@/financial-providers/hiperbanco/hiperbanco-http.service';
import { HiperbancoEndpoint } from '@/financial-providers/hiperbanco/enums/hiperbanco-endpoint.enum';
import { CreateTedDto } from '@/ted/dto/create-ted.dto';
import { handleHiperbancoError } from '@/financial-providers/hiperbanco/helpers/hiperbanco-error.helper';
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
   * @param dto Dados da transferência
   */
  async createTransfer(dto: CreateTedDto): Promise<HiperbancoTedResponse> {
    try {
      const response =
        await this.hiperbancoHttpService.post<HiperbancoTedResponse>(
          HiperbancoEndpoint.TED_TRANSFER,
          instanceToPlain(dto),
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
   */
  async getTransferStatus(
    authenticationCode: string,
    branchNumber: string,
    accountNumber: string,
  ): Promise<HiperbancoTedStatusResponse> {
    try {
      const url = `${HiperbancoEndpoint.TED_STATUS}/${authenticationCode}/${branchNumber}/${accountNumber}`;
      const response =
        await this.hiperbancoHttpService.get<HiperbancoTedStatusResponse>(url);
      return response;
    } catch (error) {
      handleHiperbancoError(error, () => {
        this.logger.error('Error fetching TED status');
      });
      throw error;
    }
  }
}
