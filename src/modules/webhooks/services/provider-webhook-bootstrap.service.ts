import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSessionHelper } from '@/webhook/helpers/provider-session.helper';
import { HiperbancoWebhookHelper } from '@/webhook/helpers/hiperbanco/hiperbanco-webhook.helper';
import {
  HIPERBANCO_WEBHOOK_MANIFEST,
} from '../manifest/hiperbanco-webhook.manifest';
import type { ListWebhooksQueryDto } from '@/webhook/dto/list-webhooks-query.dto';

@Injectable()
export class ProviderWebhookBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProviderWebhookBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly providerSessionHelper: ProviderSessionHelper,
    private readonly hiperbancoWebhookHelper: HiperbancoWebhookHelper,
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

    this.logger.log('Starting provider webhook bootstrap...');
    await this.syncHiperbancoWebhooks(publicUrl);
    this.logger.log('Provider webhook bootstrap completed.');
  }

  private async syncHiperbancoWebhooks(publicUrl: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(
        `Failed to list existing Hiperbanco webhooks: ${String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    for (const entry of HIPERBANCO_WEBHOOK_MANIFEST) {
      const callbackUrl = `${publicUrl.replace(/\/$/, '')}${entry.callbackPath}`;

      try {
        const existing = existingWebhooks.find(
          (w) => w.eventName === entry.eventName,
        );

        if (existing) {
          if (existing.uri === callbackUrl) {
            this.logger.log(
              `[SKIP] ${entry.eventName} already registered with correct URL`,
            );
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
            this.logger.log(
              `[UPDATED] ${entry.eventName} → ${callbackUrl}`,
            );
          }
        } else {
          await this.providerSessionHelper.executeWithRetry(
            FinancialProvider.HIPERBANCO,
            (session) =>
              this.hiperbancoWebhookHelper.registerWebhook(
                {
                  name: `SYSTEM_${entry.eventName}`,
                  context: entry.context,
                  uri: callbackUrl,
                  eventName: entry.eventName,
                } as any,
                session,
              ),
          );
          this.logger.log(
            `[REGISTERED] ${entry.eventName} → ${callbackUrl}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `[FAILED] Failed to sync ${entry.eventName}: ${String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }
}
