import { Injectable } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { WebhookProvider } from '@/financial-providers/contracts/webhook.provider';
import type { ProviderSession } from '@/financial-providers/contracts/provider-session';
import type { RegisterWebhookDto } from '@/webhook/dto/register-webhook.dto';
import type { UpdateWebhookDto } from '@/webhook/dto/update-webhook.dto';
import type { ListWebhooksQueryDto } from '@/webhook/dto/list-webhooks-query.dto';
import type {
  RegisterWebhookResponse,
  ListWebhooksResponse,
  UpdateWebhookResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { HiperbancoWebhookHelper } from '@/webhook/helpers/hiperbanco/hiperbanco-webhook.helper';

@Injectable()
export class HiperbancoWebhookProvider implements WebhookProvider {
  readonly providerSlug = FinancialProvider.HIPERBANCO;

  constructor(private readonly helper: HiperbancoWebhookHelper) {}

  register(
    dto: RegisterWebhookDto,
    session: ProviderSession,
  ): Promise<RegisterWebhookResponse> {
    return this.helper.registerWebhook(dto, session);
  }

  list(
    query: ListWebhooksQueryDto,
    session: ProviderSession,
  ): Promise<ListWebhooksResponse> {
    return this.helper.listWebhooks(query, session);
  }

  update(
    webhookId: string,
    dto: UpdateWebhookDto,
    session: ProviderSession,
  ): Promise<UpdateWebhookResponse> {
    return this.helper.updateWebhook(webhookId, dto.uri, session);
  }

  delete(webhookId: string, session: ProviderSession): Promise<void> {
    return this.helper.deleteWebhook(webhookId, session);
  }
}
