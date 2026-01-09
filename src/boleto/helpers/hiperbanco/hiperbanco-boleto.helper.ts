import { Injectable } from '@nestjs/common';
import { HiperbancoHttpService } from '@/financial-providers/hiperbanco/hiperbanco-http.service';
import { CreateBoletoDto } from '../../dto/create-boleto.dto';
import { CancelBoletoDto } from '../../dto/cancel-boleto.dto';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { BoletoEmissionResponse, BoletoGetDataResponse, BoletoCancelResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { BoletoType } from '../../enums/boleto-type.enum';
import { HiperbancoEndpoint } from '@/financial-providers/hiperbanco/enums/hiperbanco-endpoint.enum';

/**
 * Helper responsável pela comunicação com o Hiperbanco para operações de boletos.
 */
@Injectable()
export class HiperbancoBoletoHelper {
    constructor(private readonly hiperbancoHttp: HiperbancoHttpService) { }

    /**
     * Emite um boleto no Hiperbanco.
     * @param dto Dados do boleto a ser emitido.
     * @param session Sessão autenticada do provedor (já validada pelo guard).
     * @returns Resposta do Hiperbanco com dados do boleto emitido.
     */
    async emitBoleto(dto: CreateBoletoDto, session: ProviderSession): Promise<BoletoEmissionResponse> {
        const payload = this.buildPayload(dto);

        return this.hiperbancoHttp.post<BoletoEmissionResponse>(
            HiperbancoEndpoint.BOLETO_EMISSION,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${session.hiperbancoToken}`,
                },
            },
        );
    }

    /**
     * Busca os detalhes de um boleto no Hiperbanco.
     * @param authenticationCode Código de autenticação do boleto.
     * @param accountBranch Agência da conta.
     * @param accountNumber Número da conta.
     * @param session Sessão autenticada do provedor (já validada pelo guard).
     * @returns Resposta do Hiperbanco com dados detalhados do boleto.
     */
    async getBoletoData(
        authenticationCode: string,
        accountBranch: string,
        accountNumber: string,
        session: ProviderSession,
    ): Promise<BoletoGetDataResponse> {
        const path = `${HiperbancoEndpoint.BOLETO_GET_DATA}/${authenticationCode}/${accountBranch}/${accountNumber}`;

        return this.hiperbancoHttp.get<BoletoGetDataResponse>(
            path,
            {
                headers: {
                    Authorization: `Bearer ${session.hiperbancoToken}`,
                },
            },
        );
    }

    /**
     * Cancela um boleto no Hiperbanco.
     * @param dto Dados do boleto a ser cancelado.
     * @param session Sessão autenticada do provedor (já validada pelo guard).
     * @returns Resposta do Hiperbanco confirmando o cancelamento.
     */
    async cancelBoleto(dto: CancelBoletoDto, session: ProviderSession): Promise<BoletoCancelResponse> {
        const payload = {
            authenticationCode: dto.authenticationCode,
            account: {
                number: dto.account.number,
                branch: dto.account.branch,
            },
        };

        return this.hiperbancoHttp.delete<BoletoCancelResponse>(
            HiperbancoEndpoint.BOLETO_CANCEL,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${session.hiperbancoToken}`,
                },
            },
        );
    }

    /**
     * Constrói o payload para emissão de boleto conforme o tipo (Levy ou Deposit).
     * @param dto Dados do boleto
     * @returns Payload formatado para a API do Hiperbanco
     */
    private buildPayload(dto: CreateBoletoDto): Record<string, unknown> {
        const basePayload: Record<string, unknown> = {
            account: {
                number: dto.account.number,
                branch: dto.account.branch,
            },
            documentNumber: dto.documentNumber,
            amount: dto.amount,
            dueDate: dto.dueDate,
            type: dto.type,
        };

        if (dto.alias) {
            basePayload.alias = dto.alias;
        }

        if (dto.type === BoletoType.LEVY) {
            // Para tipo Levy, incluir campos específicos
            if (dto.closePayment) {
                basePayload.closePayment = dto.closePayment;
            }

            if (dto.payer) {
                basePayload.payer = {
                    document: dto.payer.document,
                    name: dto.payer.name,
                    tradeName: dto.payer.tradeName,
                    address: {
                        zipCode: dto.payer.address.zipCode,
                        addressLine: dto.payer.address.addressLine,
                        neighborhood: dto.payer.address.neighborhood,
                        city: dto.payer.address.city,
                        state: dto.payer.address.state,
                    },
                };
            }

            if (dto.interest) {
                basePayload.interest = {
                    startDate: dto.interest.startDate,
                    value: dto.interest.value,
                    type: dto.interest.type,
                };
            }

            if (dto.fine) {
                basePayload.fine = {
                    startDate: dto.fine.startDate,
                    value: dto.fine.value,
                    type: dto.fine.type,
                };
            }

            if (dto.discount) {
                basePayload.discount = {
                    limitDate: dto.discount.limitDate,
                    value: dto.discount.value,
                    type: dto.discount.type,
                };
            }
        }
        // Para tipo Deposit, não incluir payer, interest, fine, discount

        return basePayload;
    }
}

