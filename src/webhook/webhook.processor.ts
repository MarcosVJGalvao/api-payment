import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AppLoggerService } from '@/common/logger/logger.service';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ClientService } from '@/client/client.service';
import { WebhookRepository } from './repositories/webhook.repository';
import { getErrorMessageAndStack } from '@/common/helpers/exception.helper';
import { WebhookProviderHelper } from './helpers/webhook-provider.helper';
import { ProviderSessionHelper } from './helpers/provider-session.helper';
import { WebhookRegistrationSuccessJob } from './interfaces/webhook-registration-success-job.interface';
import { ProviderWebhookRegistrationNormalizerHelper } from './helpers/provider-webhook-registration-normalizer.helper';

export interface RegisterWebhookJob {
  provider: FinancialProvider;
  dto: RegisterWebhookDto;
  clientId: string;
}

@Injectable()
@Processor('webhook')
export class WebhookProcessor {
  private readonly context = WebhookProcessor.name;

  constructor(
    @InjectQueue('webhook-registration-success')
    private readonly webhookRegistrationSuccessQueue: Queue<WebhookRegistrationSuccessJob>,
    private readonly logger: AppLoggerService,
    private readonly clientService: ClientService,
    private readonly providerHelper: WebhookProviderHelper,
    private readonly providerSessionHelper: ProviderSessionHelper,
    private readonly providerRegistrationNormalizer: ProviderWebhookRegistrationNormalizerHelper,
    private readonly webhookRepository: WebhookRepository,
  ) {}

  @Process()
  async handleRegistration(job: Job<RegisterWebhookJob>) {
    const { provider, dto, clientId } = job.data;
    this.logger.log(
      `Processing webhook registration for client ${clientId}`,
      this.context,
    );

    try {
      // 1. Get Client Alias
      const client = await this.clientService.findById(clientId);
      const alias = client.alias;

      // 2. Format Webhook Name
      const prefix = alias ? `${String(alias)}_` : '';
      const formattedName = (prefix + dto.name).toUpperCase();
      const finalDto = { ...dto, name: formattedName };

      // 3. Register in Provider with shared session and normalized response
      const providerResponse =
        await this.providerSessionHelper.executeWithRetry(provider, (session) =>
          this.providerHelper.register(provider, finalDto, session),
        );
      const normalizedResponse = this.providerRegistrationNormalizer.normalize(
        provider,
        providerResponse,
      );

      // 4. Save in DB (using original clientId)
      const savedWebhook = await this.webhookRepository.saveWebhook(
        provider,
        finalDto,
        normalizedResponse,
        clientId,
      );

      // 5. Notify integration API about successful registration (best effort with retries queue)
      const callbackUri = savedWebhook.registrationCallbackUri;
      if (!callbackUri) {
        this.logger.warn(
          `Registration success callback URI not configured for webhook ${savedWebhook.id}; notification skipped.`,
          this.context,
        );
      } else {
        if (!savedWebhook.externalId) {
          this.logger.warn(
            `Provider webhook id missing for webhook ${savedWebhook.id}; notification skipped.`,
            this.context,
          );
          return;
        }

        const webhookWithSecret =
          await this.webhookRepository.findByIdWithCallbackSecret(
            savedWebhook.id,
          );

        await this.webhookRegistrationSuccessQueue.add({
          webhookId: savedWebhook.id,
          callbackUri,
          callbackSecret: webhookWithSecret?.registrationCallbackSecret ?? null,
          payload: {
            event: 'WEBHOOK_REGISTRATION_SUCCEEDED',
            status: 'SUCCESS',
            provider,
            clientId,
            webhookId: savedWebhook.id,
            providerWebhookId: savedWebhook.externalId,
            name: savedWebhook.name,
            context: savedWebhook.context,
            eventName: savedWebhook.eventName,
            uri: savedWebhook.uri,
            publicKey: savedWebhook.publicKey ?? null,
            occurredAt: new Date().toISOString(),
            providerRawResponse: normalizedResponse.providerRawResponse,
          },
        });
      }

      this.logger.log(
        `[SUCESSO] Webhook cadastrado para Client ${clientId} (Alias: ${alias}). Name: ${formattedName}`,
        this.context,
      );
    } catch (error) {
      const { message: errorMessage, stack: errorStack } =
        getErrorMessageAndStack(error);

      this.logger.error(
        `Failed to process webhook registration for client ${clientId}: ${errorMessage}`,
        errorStack,
        this.context,
      );
    }
  }
}
