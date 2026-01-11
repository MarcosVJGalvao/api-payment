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
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import type { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { AppLoggerService } from '@/common/logger/logger.service';
import { HiperbancoAuthService } from '@/financial-providers/hiperbanco/hiperbanco-auth.service';
import { ProviderLoginType } from '@/financial-providers/enums/provider-login-type.enum';

@Injectable()
export class WebhookService {
  private readonly context = WebhookService.name;

  constructor(
    @InjectQueue('webhook') private readonly webhookQueue: Queue,
    private readonly providerHelper: WebhookProviderHelper,
    private readonly webhookRepository: WebhookRepository,
    private readonly logger: AppLoggerService,
    private readonly hiperbancoAuthService: HiperbancoAuthService,
  ) {}

  private async ensureSession(
    session: ProviderSession | null,
    provider: FinancialProvider,
  ): Promise<ProviderSession> {
    if (session) return session;

    if (provider === FinancialProvider.HIPERBANCO) {
      const token =
        await this.hiperbancoAuthService.getSharedBackofficeSession();
      return {
        sessionId: 'SHARED_BACKOFFICE_SESSION',
        providerSlug: provider,
        clientId: 'SHARED_BACKOFFICE',
        hiperbancoToken: token,
        loginType: ProviderLoginType.BACKOFFICE,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600 * 1000,
      } as any;
    }

    throw new CustomHttpException(
      'Provider does not support shared session',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_INPUT,
    );
  }

  async registerWebhook(
    provider: FinancialProvider,
    dto: RegisterWebhookDto,
    session: ProviderSession | null,
    clientId: string,
  ): Promise<any> {
    // Add to Queue
    await this.webhookQueue.add(
      {
        provider,
        dto,
        clientId,
      },
      {
        delay: 5000, // 5s delay as requested
        attempts: 3,
        backoff: 1000,
      },
    );

    this.logger.log(
      `Webhook registration queued for client ${clientId}`,
      this.context,
    );

    // Return Accepted
    return {
      message: 'Webhook registration queued',
      status: 'PROCESSING',
    };
  }

  async listWebhooks(
    provider: FinancialProvider,
    query: ListWebhooksQueryDto,
    session: ProviderSession | null,
    clientId: string,
  ): Promise<ListWebhooksResponse> {
    const effectiveSession = await this.ensureSession(session, provider);

    // Filtrar webhooks do provedor que pertencem ao clientId
    const allWebhooks = await this.providerHelper.list(
      provider,
      query,
      effectiveSession,
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
    session: ProviderSession | null,
    clientId: string,
  ): Promise<UpdateWebhookResponse> {
    const effectiveSession = await this.ensureSession(session, provider);

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
      effectiveSession,
    );
    await this.webhookRepository.updateWebhookUri(webhookId, dto.uri);
    return response;
  }

  async deleteWebhook(
    provider: FinancialProvider,
    webhookId: string,
    session: ProviderSession | null,
    clientId: string,
  ): Promise<void> {
    const effectiveSession = await this.ensureSession(session, provider);

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

    await this.providerHelper.delete(provider, webhookId, effectiveSession);
    await this.webhookRepository.softDelete(webhook.id);
  }
}
