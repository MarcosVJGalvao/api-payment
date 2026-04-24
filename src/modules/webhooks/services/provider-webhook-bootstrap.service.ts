import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSessionHelper } from '@/webhook/helpers/provider-session.helper';
import { HiperbancoWebhookHelper } from '@/webhook/helpers/hiperbanco/hiperbanco-webhook.helper';
import { WebhookRepository } from '@/webhook/repositories/webhook.repository';
import {
  HIPERBANCO_WEBHOOK_MANIFEST,
  type HiperbancoWebhookManifestEntry,
} from '../manifest/hiperbanco-webhook.manifest';
import type { ListWebhooksQueryDto } from '@/webhook/dto/list-webhooks-query.dto';
import type { RegisterWebhookDto } from '@/webhook/dto/register-webhook.dto';

export interface BootstrapSyncResult {
  registered: number;
  updated: number;
  skipped: number;
  failed: number;
}

@Injectable()
export class ProviderWebhookBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProviderWebhookBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly providerSessionHelper: ProviderSessionHelper,
    private readonly hiperbancoWebhookHelper: HiperbancoWebhookHelper,
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled = this.configService.get<string>(
      'PROVIDER_WEBHOOK_BOOTSTRAP_ENABLED',
      'false',
    );
    if (enabled !== 'true') {
      this.logger.log(
        'Provider webhook bootstrap disabled (PROVIDER_WEBHOOK_BOOTSTRAP_ENABLED != true)',
      );
      return;
    }

    const publicUrl = this.configService.get<string>('API_PAYMENT_PUBLIC_URL');
    if (!publicUrl) {
      this.logger.error(
        'PROVIDER_WEBHOOK_BOOTSTRAP_ENABLED=true but API_PAYMENT_PUBLIC_URL is not set. Skipping bootstrap.',
      );
      return;
    }

    this.logger.warn('Starting provider webhook bootstrap...');
    const result = await this.syncHiperbancoWebhooks(publicUrl);
    this.logger.warn(
      `Bootstrap completed — registered: ${result.registered}, updated: ${result.updated}, skipped: ${result.skipped}, failed: ${result.failed}`,
    );
  }

  async syncProvider(
    provider: FinancialProvider,
  ): Promise<BootstrapSyncResult> {
    const publicUrl = this.configService.get<string>('API_PAYMENT_PUBLIC_URL');
    if (!publicUrl) {
      throw new Error('API_PAYMENT_PUBLIC_URL is not configured');
    }

    if (provider === FinancialProvider.HIPERBANCO) {
      return this.syncHiperbancoWebhooks(publicUrl);
    }

    throw new Error(
      `Manifest bootstrap not supported for provider: ${String(provider)}`,
    );
  }

  private async syncHiperbancoWebhooks(
    publicUrl: string,
  ): Promise<BootstrapSyncResult> {
    let existingWebhooks: { id: string; eventName: string; uri: string }[] = [];

    try {
      const response = await this.providerSessionHelper.executeWithRetry(
        FinancialProvider.HIPERBANCO,
        (session) =>
          this.hiperbancoWebhookHelper.listWebhooks(
            { page: 1, pageSize: 100 } as ListWebhooksQueryDto,
            session,
          ),
      );
      existingWebhooks = response.data.map((item) => ({
        id: item.id,
        eventName: item.eventName,
        uri: item.uri,
      }));
      this.logger.warn(
        `Bootstrap: found ${existingWebhooks.length} existing webhooks at Hiperbanco`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to list existing Hiperbanco webhooks: ${String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    let registered = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const entry of HIPERBANCO_WEBHOOK_MANIFEST) {
      const callbackUrl = `${publicUrl.replace(/\/$/, '')}${entry.callbackPath}`;

      try {
        const existing = existingWebhooks.find(
          (w) => w.eventName === (entry.eventName as string),
        );

        if (existing) {
          if (existing.uri === callbackUrl) {
            this.logger.log(
              `[SKIP] ${entry.eventName} already registered with correct URL`,
            );
            skipped++;
          } else {
            await this.providerSessionHelper.executeWithRetry(
              FinancialProvider.HIPERBANCO,
              (session) =>
                this.hiperbancoWebhookHelper.updateWebhook(
                  existing.id,
                  callbackUrl,
                  session,
                ),
            );
            await this.webhookRepository.updateWebhookUri(
              existing.id,
              callbackUrl,
            );
            this.logger.warn(`[UPDATED] ${entry.eventName} → ${callbackUrl}`);
            updated++;
          }
        } else {
          await this.registerAndSave(
            entry,
            callbackUrl,
            FinancialProvider.HIPERBANCO,
          );
          this.logger.warn(`[REGISTERED] ${entry.eventName} → ${callbackUrl}`);
          registered++;
        }
      } catch (error) {
        failed++;
        this.logger.error(
          `[FAILED] Failed to sync ${entry.eventName}: ${String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return { registered, updated, skipped, failed };
  }

  private async registerAndSave(
    entry: HiperbancoWebhookManifestEntry,
    callbackUrl: string,
    provider: FinancialProvider,
  ): Promise<void> {
    const dto: RegisterWebhookDto = {
      name: `SYSTEM_${entry.eventName}`,
      context: entry.context,
      uri: callbackUrl,
      eventName: entry.eventName,
    } as RegisterWebhookDto;

    const response = await this.providerSessionHelper.executeWithRetry(
      provider,
      (session) => this.hiperbancoWebhookHelper.registerWebhook(dto, session),
    );

    await this.webhookRepository.saveWebhook(provider, dto, {
      providerWebhookId: response.id,
      providerPublicKey: response.publicKey ?? null,
      providerName: response.name,
      providerRawResponse: response as unknown as Record<string, unknown>,
    });
  }
}
