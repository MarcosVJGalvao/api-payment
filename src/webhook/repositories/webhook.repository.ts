import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../entities/webhook.entity';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { FinancialProvider } from '../../common/enums/financial-provider.enum';
import { ProviderWebhookRegistrationResult } from '../interfaces/provider-webhook-registration-result.interface';

/**
 * Repositório customizado para operações de persistência de Webhooks.
 */
@Injectable()
export class WebhookRepository {
  constructor(
    @InjectRepository(Webhook)
    private readonly repository: Repository<Webhook>,
  ) {}

  getRepository(): Repository<Webhook> {
    return this.repository;
  }

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
    response: ProviderWebhookRegistrationResult,
  ): Promise<Webhook> {
    const webhook = this.repository.create({
      name: dto.name,
      context: dto.context,
      eventName: dto.eventName,
      uri: dto.uri,
      providerSlug: provider,
      externalId: response.providerWebhookId,
      publicKey: response.providerPublicKey ?? null,
      registrationCallbackUri: dto.registrationCallbackUri ?? null,
      registrationCallbackSecret: dto.registrationCallbackSecret ?? null,
      isActive: true,
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

  async findByExternalIdAndProvider(
    externalId: string,
    provider: FinancialProvider,
  ): Promise<Webhook | null> {
    return this.repository.findOne({
      where: { externalId, providerSlug: provider },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async softDeleteByExternalId(externalId: string): Promise<void> {
    await this.repository.softDelete({ externalId });
  }

  async deleteByExternalId(externalId: string): Promise<void> {
    await this.repository.delete({ externalId });
  }

  async findAll(): Promise<Webhook[]> {
    return this.repository.find();
  }

  async hardDeleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateWebhookUri(externalId: string, uri: string): Promise<void> {
    await this.repository.update({ externalId }, { uri });
  }

  async updateWebhookConfig(
    externalId: string,
    data: {
      uri?: string;
      registrationCallbackUri?: string | null;
      registrationCallbackSecret?: string | null;
    },
  ): Promise<void> {
    await this.repository.update({ externalId }, data);
  }

  async findByIdWithCallbackSecret(id: string): Promise<Webhook | null> {
    return this.repository
      .createQueryBuilder('webhook')
      .addSelect('webhook.registrationCallbackSecret')
      .where('webhook.id = :id', { id })
      .getOne();
  }
}
