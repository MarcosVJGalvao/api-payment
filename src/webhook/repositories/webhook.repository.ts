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
     * @returns Webhook persistido.
     */
    async saveWebhook(
        provider: FinancialProvider,
        dto: RegisterWebhookDto,
        response: RegisterWebhookResponse,
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
        });
        return this.repository.save(webhook);
    }

    async findById(id: string): Promise<Webhook | null> {
        return this.repository.findOne({ where: { id } });
    }

    async findByProvider(provider: FinancialProvider): Promise<Webhook[]> {
        return this.repository.find({ where: { providerSlug: provider } });
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.softDelete(id);
    }
}
