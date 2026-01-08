import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../entities/webhook.entity';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { RegisterWebhookResponse } from '../../financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { FinancialProvider } from '../../common/enums/financial-provider.enum';

/**
 * Repositório customizado para operações de persistência de Webhooks.
 */
@Injectable()
export class WebhookRepository {
    constructor(
        @InjectRepository(Webhook)
        private readonly repository: Repository<Webhook>,
    ) { }

    /**
     * Salva um webhook no banco de dados após registro no provedor.
     * @param provider Provedor financeiro.
     * @param dto Dados do webhook.
     * @param response Resposta do provedor.
     * @param clientId ID do cliente.
     * @returns Webhook persistido.
     */
    async saveWebhook(
        provider: FinancialProvider,
        dto: RegisterWebhookDto,
        response: RegisterWebhookResponse,
        clientId: string,
    ): Promise<Webhook> {
        const webhook = this.repository.create({
            name: dto.name,
            context: dto.context,
            eventName: dto.eventName,
            uri: dto.uri,
            providerSlug: provider,
            externalId: response.id,
            publicKey: response.publicKey,
            isActive: true,
            clientId,
        });
        return this.repository.save(webhook);
    }

    async findById(id: string): Promise<Webhook | null> {
        return this.repository.findOne({ where: { id } });
    }

    async findByExternalId(externalId: string): Promise<Webhook | null> {
        return this.repository.findOne({ where: { externalId } });
    }

    async findByProvider(provider: FinancialProvider): Promise<Webhook[]> {
        return this.repository.find({ where: { providerSlug: provider } });
    }

    async findByClientId(clientId: string): Promise<Webhook[]> {
        return this.repository.find({ where: { clientId } });
    }

    async findByExternalIdAndClient(externalId: string, clientId: string): Promise<Webhook | null> {
        return this.repository.findOne({ where: { externalId, clientId } });
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.softDelete(id);
    }

    async updateWebhookUri(externalId: string, uri: string): Promise<void> {
        await this.repository.update({ externalId }, { uri });
    }
}
