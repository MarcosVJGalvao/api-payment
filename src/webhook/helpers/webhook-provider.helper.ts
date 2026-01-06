import { Injectable, HttpStatus } from '@nestjs/common';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { RegisterWebhookResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HiperbancoWebhookHelper } from './hiperbanco/hiperbanco-webhook.helper';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';

/**
 * Helper responsável por rotear requisições de webhook para o provedor correto.
 */
@Injectable()
export class WebhookProviderHelper {
    constructor(private readonly hiperbancoHelper: HiperbancoWebhookHelper) { }

    /**
     * Registra um webhook no provedor especificado.
     * @param provider Provedor financeiro.
     * @param dto Dados do webhook.
     * @param session Sessão autenticada do provedor.
     * @returns Resposta do provedor.
     */
    async register(
        provider: FinancialProvider,
        dto: RegisterWebhookDto,
        session: ProviderSession,
    ): Promise<RegisterWebhookResponse> {
        switch (provider) {
            case FinancialProvider.HIPERBANCO:
                return this.hiperbancoHelper.registerWebhook(dto, session);
            default:
                throw new CustomHttpException(
                    `Provider ${provider} não suportado`,
                    HttpStatus.BAD_REQUEST,
                    ErrorCode.INVALID_INPUT,
                );
        }
    }
}
