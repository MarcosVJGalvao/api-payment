import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import {
  type WebhookItem,
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

  private sanitizeWebhook(
    webhook: Webhook,
  ): Omit<Webhook, 'registrationCallbackSecret'> {
    const {
      registrationCallbackSecret: _registrationCallbackSecret,
      ...safeWebhook
    } = webhook;

    return {
      ...safeWebhook,
      id: webhook.externalId ?? webhook.id,
    };
  }

  async registerWebhook(
    provider: FinancialProvider,
    dto: RegisterWebhookDto,
    clientId?: string,
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
    const webhooks = await this.webhookRepository.findByClientIdAndProvider(
      clientId,
      provider,
    );
    return webhooks.map((webhook) => this.sanitizeWebhook(webhook) as Webhook);
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
        'Webhook configuration not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.WEBHOOK_CONFIG_NOT_FOUND,
      );
    }

    const response = await this.providerSessionHelper.executeWithRetry(
      provider,
      (session) =>
        this.providerHelper.update(provider, webhookId, dto, session),
    );
    await this.webhookRepository.updateWebhookConfig(webhookId, {
      uri: dto.uri,
      registrationCallbackUri: dto.registrationCallbackUri,
      registrationCallbackSecret: dto.registrationCallbackSecret,
    });
    return response;
  }

  async deleteAllWebhooksFromProvider(provider: FinancialProvider): Promise<{
    deleted: number;
    failed: number;
    errors: { externalId: string; eventName: string; error: string }[];
  }> {
    const dbWebhooks = await this.webhookRepository.findByProvider(provider);
    const providerWebhooks = await this.fetchAllProviderWebhooks(provider);

    this.logger.log(
      `deleteAllWebhooksFromProvider: ${dbWebhooks.length} in DB, ${providerWebhooks.length} at provider`,
      this.context,
    );

    let deleted = 0;
    let failed = 0;
    const errors: { externalId: string; eventName: string; error: string }[] =
      [];

    const deletedExternalIds = new Set<string>();

    // Step 1: delete DB records using their externalId at the provider
    for (const dw of dbWebhooks) {
      const ref = dw.externalId ?? `db:${dw.id}`;
      try {
        if (!dw.externalId) {
          throw new Error(
            `Webhook ${dw.id} has no externalId; provider deletion skipped`,
          );
        }

        const externalId = dw.externalId;
        await this.providerSessionHelper.executeWithRetry(provider, (session) =>
          this.providerHelper.delete(provider, externalId, session),
        );
        deletedExternalIds.add(externalId);
        await this.webhookRepository.hardDeleteById(dw.id);
        deleted++;
        this.logger.log(
          `Deleted webhook ${ref} (${dw.eventName}) from provider and DB`,
          this.context,
        );
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          externalId: ref,
          eventName: dw.eventName,
          error: message,
        });
        this.logger.error(
          `Failed to delete webhook ${ref} (${dw.eventName}): ${message}`,
          this.context,
        );
      }
    }

    // Step 2: delete provider-only webhooks (not tracked in DB)
    const dbExternalIds = new Set(
      dbWebhooks.map((dw) => dw.externalId).filter(Boolean),
    );
    for (const pw of providerWebhooks) {
      const providerExternalId = pw.externalId ?? pw.id;
      if (
        dbExternalIds.has(providerExternalId) ||
        deletedExternalIds.has(providerExternalId)
      ) {
        continue;
      }
      try {
        await this.providerSessionHelper.executeWithRetry(provider, (session) =>
          this.providerHelper.delete(provider, providerExternalId, session),
        );
        deleted++;
        this.logger.log(
          `Deleted provider-only webhook ${providerExternalId} (${pw.eventName})`,
          this.context,
        );
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          externalId: providerExternalId,
          eventName: pw.eventName,
          error: message,
        });
        this.logger.error(
          `Failed to delete provider-only webhook ${providerExternalId} (${pw.eventName}): ${message}`,
          this.context,
        );
      }
    }

    return { deleted, failed, errors };
  }

  private async fetchAllProviderWebhooks(
    provider: FinancialProvider,
  ): Promise<WebhookItem[]> {
    const allItems: WebhookItem[] = [];
    const pageSize = 100;
    let page = 1;

    for (;;) {
      const response = await this.providerSessionHelper.executeWithRetry(
        provider,
        (session) =>
          this.providerHelper.list(provider, { page, pageSize }, session),
      );
      const items: WebhookItem[] = Array.isArray(response.data)
        ? response.data
        : [];
      allItems.push(...items);
      const total = response.meta?.total ?? 0;
      if (items.length < pageSize || allItems.length >= total) {
        break;
      }
      page++;
    }

    return allItems;
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

    await this.providerSessionHelper.executeWithRetry(provider, (session) =>
      this.providerHelper.delete(provider, webhookId, session),
    );

    if (webhook) {
      await this.webhookRepository.softDelete(webhook.id);
      return;
    }

    this.logger.warn(
      `Webhook ${webhookId} deleted from provider without local DB record for client ${clientId}`,
      this.context,
    );
  }
}
