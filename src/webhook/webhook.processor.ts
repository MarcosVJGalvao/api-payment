import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AppLoggerService } from '@/common/logger/logger.service';
import { HiperbancoAuthService } from '@/financial-providers/hiperbanco/hiperbanco-auth.service';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ClientService } from '@/client/client.service';
import { HiperbancoWebhookHelper } from './helpers/hiperbanco/hiperbanco-webhook.helper';
import { WebhookRepository } from './repositories/webhook.repository';
import { ProviderLoginType } from '@/financial-providers/enums/provider-login-type.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { RegisterWebhookResponse } from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

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
    private readonly logger: AppLoggerService,
    private readonly hiperbancoAuthService: HiperbancoAuthService,
    private readonly clientService: ClientService,
    private readonly hiperbancoHelper: HiperbancoWebhookHelper,
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

      // 3. Get Shared Token
      let token = '';
      if (provider === FinancialProvider.HIPERBANCO) {
        token = await this.hiperbancoAuthService.getSharedBackofficeSession();
      }

      // 4. Create Synthetic Session for Helper
      const session: ProviderSession = {
        sessionId: 'SHARED_BACKOFFICE_SESSION', // Dummy ID
        providerSlug: provider,
        clientId: 'SHARED_BACKOFFICE', // This session is system-wide
        hiperbancoToken: token,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600 * 1000,
        loginType: ProviderLoginType.BACKOFFICE,
      };

      // 5. Register in Provider
      let response: RegisterWebhookResponse;
      if (provider === FinancialProvider.HIPERBANCO) {
        response = await this.hiperbancoHelper.registerWebhook(
          finalDto,
          session,
        );
      } else {
        throw new CustomHttpException(
          'Provider not supported in queue',
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_FINANCIAL_PROVIDER,
        );
      }

      // 6. Save in DB (using original clientId)
      // Note: Repository expects provider DTO but saves associated with clientId
      await this.webhookRepository.saveWebhook(
        provider,
        finalDto,
        response,
        clientId,
      );

      this.logger.log(
        `[SUCESSO] Webhook cadastrado para Client ${clientId} (Alias: ${alias}). Name: ${formattedName}`,
        this.context,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to process webhook registration for client ${clientId}: ${errorMessage}`,
        errorStack,
        this.context,
      );
    }
  }
}
