import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from './provider-session';
import type { RegisterWebhookDto } from '@/webhook/dto/register-webhook.dto';
import type { UpdateWebhookDto } from '@/webhook/dto/update-webhook.dto';
import type { ListWebhooksQueryDto } from '@/webhook/dto/list-webhooks-query.dto';
import type {
  RegisterWebhookResponse,
  ListWebhooksResponse,
  UpdateWebhookResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';

export interface WebhookProvider {
  readonly providerSlug: FinancialProvider;

  register(
    dto: RegisterWebhookDto,
    session: ProviderSession,
  ): Promise<RegisterWebhookResponse>;

  list(
    query: ListWebhooksQueryDto,
    session: ProviderSession,
  ): Promise<ListWebhooksResponse>;

  update(
    webhookId: string,
    dto: UpdateWebhookDto,
    session: ProviderSession,
  ): Promise<UpdateWebhookResponse>;

  delete(webhookId: string, session: ProviderSession): Promise<void>;
}
