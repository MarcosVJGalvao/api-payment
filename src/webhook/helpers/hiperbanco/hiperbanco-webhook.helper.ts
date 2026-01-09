import { Injectable } from '@nestjs/common';
import { HiperbancoHttpService } from '@/financial-providers/hiperbanco/hiperbanco-http.service';
import { RegisterWebhookDto } from '../../dto/register-webhook.dto';
import { ListWebhooksQueryDto } from '../../dto/list-webhooks-query.dto';
import { RegisterWebhookResponse, ListWebhooksResponse, UpdateWebhookResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { HiperbancoEndpoint } from '@/financial-providers/hiperbanco/enums/hiperbanco-endpoint.enum';

/**
 * Helper responsável pela comunicação com o Hiperbanco para operações de webhooks.
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
            HiperbancoEndpoint.WEBHOOK_REGISTER,
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

    /**
     * Lista webhooks registrados no Hiperbanco.
     * @param query Parâmetros de filtro e paginação.
     * @param session Sessão autenticada do provedor.
     * @returns Lista paginada de webhooks.
     */
    async listWebhooks(query: ListWebhooksQueryDto, session: ProviderSession): Promise<ListWebhooksResponse> {
        const params: Record<string, string | number> = {};

        if (query.status) {
            params.status = query.status;
        }
        if (query.page) {
            params.page = query.page;
        }
        if (query.pageSize) {
            params.pageSize = query.pageSize;
        }

        return this.hiperbancoHttp.get<ListWebhooksResponse>(
            HiperbancoEndpoint.WEBHOOK_LIST,
            {
                params,
                headers: {
                    Authorization: `Bearer ${session.hiperbancoToken}`,
                },
            },
        );
    }

    /**
     * Atualiza a URL de um webhook existente no Hiperbanco.
     * @param webhookId ID do webhook a ser atualizado.
     * @param uri Nova URL do webhook.
     * @param session Sessão autenticada do provedor.
     * @returns Dados do webhook atualizado.
     */
    async updateWebhook(webhookId: string, uri: string, session: ProviderSession): Promise<UpdateWebhookResponse> {
        return this.hiperbancoHttp.patch<UpdateWebhookResponse>(
            `${HiperbancoEndpoint.WEBHOOK_UPDATE}/${webhookId}`,
            { uri },
            {
                headers: {
                    Authorization: `Bearer ${session.hiperbancoToken}`,
                },
            },
        );
    }

    /**
     * Remove um webhook no Hiperbanco.
     * @param webhookId ID do webhook a ser removido (ID externo).
     * @param session Sessão autenticada do provedor.
     */
    async deleteWebhook(webhookId: string, session: ProviderSession): Promise<void> {
        await this.hiperbancoHttp.delete(
            `${HiperbancoEndpoint.WEBHOOK_DELETE}/${webhookId}`,
            {
                headers: {
                    Authorization: `Bearer ${session.hiperbancoToken}`,
                },
            },
        );
    }
}
