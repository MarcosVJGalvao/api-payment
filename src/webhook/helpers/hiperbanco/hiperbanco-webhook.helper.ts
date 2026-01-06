import { Injectable } from '@nestjs/common';
import { HiperbancoHttpService } from '@/financial-providers/hiperbanco/hiperbanco-http.service';
import { RegisterWebhookDto } from '../../dto/register-webhook.dto';
import { RegisterWebhookResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';

/**
 * Helper responsável pela comunicação com o Hiperbanco para registro de webhooks.
 */
@Injectable()
export class HiperbancoWebhookHelper {
    constructor(private readonly hiperbancoHttp: HiperbancoHttpService) { }

    /**
     * Registra um webhook no Hiperbanco.
     * @param dto Dados do webhook a ser registrado.
     * @param session Sessão autenticada do provedor (já validada pelo guard).
     * @returns Resposta do Hiperbanco com id e publicKey.
     */
    async registerWebhook(dto: RegisterWebhookDto, session: ProviderSession): Promise<RegisterWebhookResponse> {
        return this.hiperbancoHttp.post<RegisterWebhookResponse>(
            '/WebhookInternal/registerWebhook',
            {
                name: dto.name,
                context: dto.context,
                uri: dto.uri,
                eventName: dto.eventName,
            },
            {
                headers: {
                    Authorization: `Bearer ${session.hiperbancoToken}`,
                },
            },
        );
    }
}
