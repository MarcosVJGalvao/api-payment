import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateBoletoDto } from '../dto/create-boleto.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HiperbancoBoletoHelper } from './hiperbanco/hiperbanco-boleto.helper';
import { BoletoEmissionResponse, BoletoGetDataResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';

/**
 * Helper responsável por rotear requisições de boleto para o provedor correto.
 */
@Injectable()
export class BoletoProviderHelper {
    constructor(private readonly hiperbancoHelper: HiperbancoBoletoHelper) { }

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
        switch (provider) {
            case FinancialProvider.HIPERBANCO:
                return this.hiperbancoHelper.emitBoleto(dto, session);
            default:
                throw new CustomHttpException(
                    `Provider ${provider} is not supported`,
                    HttpStatus.BAD_REQUEST,
                    ErrorCode.INVALID_INPUT,
                );
        }
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
        switch (provider) {
            case FinancialProvider.HIPERBANCO:
                return this.hiperbancoHelper.getBoletoData(authenticationCode, accountBranch, accountNumber, session);
            default:
                throw new CustomHttpException(
                    `Provider ${provider} is not supported`,
                    HttpStatus.BAD_REQUEST,
                    ErrorCode.INVALID_INPUT,
                );
        }
    }
}
