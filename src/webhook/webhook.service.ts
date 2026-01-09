import { Injectable, HttpStatus } from '@nestjs/common';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import {
  RegisterWebhookResponse,
  ListWebhooksResponse,
  UpdateWebhookResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { WebhookProviderHelper } from './helpers/webhook-provider.helper';
import { WebhookRepository } from './repositories/webhook.repository';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AppLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class WebhookService {
  private readonly context = WebhookService.name;

  constructor(
    private readonly providerHelper: WebhookProviderHelper,
    private readonly webhookRepository: WebhookRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async registerWebhook(
    provider: FinancialProvider,
    dto: RegisterWebhookDto,
    session: ProviderSession,
    clientId: string,
  ): Promise<RegisterWebhookResponse> {
    const response = await this.providerHelper.register(provider, dto, session);
    await this.webhookRepository.saveWebhook(provider, dto, response, clientId);
    return response;
  }

  async listWebhooks(
    provider: FinancialProvider,
    query: ListWebhooksQueryDto,
    session: ProviderSession,
    clientId: string,
  ): Promise<ListWebhooksResponse> {
    // Filtrar webhooks do provedor que pertencem ao clientId
    const allWebhooks = await this.providerHelper.list(
      provider,
      query,
      session,
    );

    // Filtrar localmente por clientId
    const localWebhooks = await this.webhookRepository.findByClientId(clientId);
    const localExternalIds = new Set(localWebhooks.map((w) => w.externalId));

    // Filtrar apenas webhooks que existem localmente e pertencem ao client
    const filteredData = allWebhooks.data.filter((wh) =>
      localExternalIds.has(wh.id),
    );

    return {
      ...allWebhooks,
      data: filteredData,
      meta: {
        ...allWebhooks.meta,
        total: filteredData.length,
      },
    };
  }

  async updateWebhook(
    provider: FinancialProvider,
    webhookId: string,
    dto: UpdateWebhookDto,
    session: ProviderSession,
    clientId: string,
  ): Promise<UpdateWebhookResponse> {
    // Validar que webhook pertence ao clientId
    const webhook = await this.webhookRepository.findByExternalIdAndClient(
      webhookId,
      clientId,
    );
    if (!webhook) {
      throw new CustomHttpException(
        'Webhook não encontrado ou não pertence a este cliente',
        HttpStatus.NOT_FOUND,
        ErrorCode.WEBHOOK_CONFIG_NOT_FOUND,
      );
    }

    const response = await this.providerHelper.update(
      provider,
      webhookId,
      dto,
      session,
    );
    await this.webhookRepository.updateWebhookUri(webhookId, dto.uri);
    return response;
  }

  async deleteWebhook(
    provider: FinancialProvider,
    webhookId: string,
    session: ProviderSession,
    clientId: string,
  ): Promise<void> {
    // Validar que webhook pertence ao clientId
    const webhook = await this.webhookRepository.findByExternalIdAndClient(
      webhookId,
      clientId,
    );
    if (!webhook) {
      throw new CustomHttpException(
        'Webhook não encontrado ou não pertence a este cliente',
        HttpStatus.NOT_FOUND,
        ErrorCode.WEBHOOK_CONFIG_NOT_FOUND,
      );
    }

    await this.providerHelper.delete(provider, webhookId, session);
    await this.webhookRepository.softDelete(webhook.id);
  }
}
