import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import {
  ListWebhooksResponse,
  UpdateWebhookResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { WebhookProviderHelper } from './helpers/webhook-provider.helper';
import { WebhookRepository } from './repositories/webhook.repository';
import { Webhook } from './entities/webhook.entity';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AppLoggerService } from '@/common/logger/logger.service';
import { ProviderSessionHelper } from './helpers/provider-session.helper';

@Injectable()
export class WebhookService {
  private readonly context = WebhookService.name;

  constructor(
    @InjectQueue('webhook') private readonly webhookQueue: Queue,
    private readonly providerHelper: WebhookProviderHelper,
    private readonly webhookRepository: WebhookRepository,
    private readonly logger: AppLoggerService,
    private readonly providerSessionHelper: ProviderSessionHelper,
  ) {}

  async registerWebhook(
    provider: FinancialProvider,
    dto: RegisterWebhookDto,
    clientId: string,
  ): Promise<{ message: string; status: string }> {
    await this.webhookQueue.add({
      provider,
      dto,
      clientId,
    });

    this.logger.log(
      `Webhook registration queued for client ${clientId}`,
      this.context,
    );

    return {
      message: 'Webhook registration queued',
      status: 'PROCESSING',
    };
  }

  async listWebhooks(
    provider: FinancialProvider,
    clientId: string,
  ): Promise<Webhook[]> {
    return this.webhookRepository.findByClientIdAndProvider(clientId, provider);
  }

  async listWebhooksFromProvider(
    provider: FinancialProvider,
    query: ListWebhooksQueryDto,
  ): Promise<ListWebhooksResponse> {
    return this.providerSessionHelper.executeWithRetry(provider, (session) =>
      this.providerHelper.list(provider, query, session),
    );
  }

  async updateWebhook(
    provider: FinancialProvider,
    webhookId: string,
    dto: UpdateWebhookDto,
    clientId: string,
  ): Promise<UpdateWebhookResponse> {
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

    const response = await this.providerSessionHelper.executeWithRetry(
      provider,
      (session) =>
        this.providerHelper.update(provider, webhookId, dto, session),
    );
    await this.webhookRepository.updateWebhookUri(webhookId, dto.uri);
    return response;
  }

  async deleteWebhook(
    provider: FinancialProvider,
    webhookId: string,
    clientId: string,
  ): Promise<void> {
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

    await this.providerSessionHelper.executeWithRetry(provider, (session) =>
      this.providerHelper.delete(provider, webhookId, session),
    );
    await this.webhookRepository.softDelete(webhook.id);
  }
}
