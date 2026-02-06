import { Injectable } from '@nestjs/common';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { ListWebhooksQueryDto } from '../dto/list-webhooks-query.dto';
import {
  RegisterWebhookResponse,
  ListWebhooksResponse,
  UpdateWebhookResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import { WebhookProviderRegistry } from '@/financial-providers/registry/webhook-provider.registry';

/**
 * Helper responsável por rotear requisições de webhook para o provedor correto.
 */
@Injectable()
export class WebhookProviderHelper {
  constructor(private readonly registry: WebhookProviderRegistry) {}

  /**
   * Registra um webhook no provedor especificado.
   */
  async register(
    provider: FinancialProvider,
    dto: RegisterWebhookDto,
    session: ProviderSession,
  ): Promise<RegisterWebhookResponse> {
    return this.registry.get(provider).register(dto, session);
  }

  /**
   * Lista webhooks do provedor especificado.
   */
  async list(
    provider: FinancialProvider,
    query: ListWebhooksQueryDto,
    session: ProviderSession,
  ): Promise<ListWebhooksResponse> {
    return this.registry.get(provider).list(query, session);
  }

  /**
   * Atualiza um webhook no provedor especificado.
   */
  async update(
    provider: FinancialProvider,
    webhookId: string,
    dto: UpdateWebhookDto,
    session: ProviderSession,
  ): Promise<UpdateWebhookResponse> {
    return this.registry.get(provider).update(webhookId, dto, session);
  }

  /**
   * Remove um webhook no provedor especificado.
   */
  async delete(
    provider: FinancialProvider,
    webhookId: string,
    session: ProviderSession,
  ): Promise<void> {
    return this.registry.get(provider).delete(webhookId, session);
  }
}
