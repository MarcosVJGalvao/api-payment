import { Injectable, HttpStatus } from '@nestjs/common';
import { RegisterWebhookDto } from '../dto/register-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { ListWebhooksQueryDto } from '../dto/list-webhooks-query.dto';
import {
  RegisterWebhookResponse,
  ListWebhooksResponse,
  UpdateWebhookResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HiperbancoWebhookHelper } from './hiperbanco/hiperbanco-webhook.helper';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';

/**
 * Helper responsável por rotear requisições de webhook para o provedor correto.
 */
@Injectable()
export class WebhookProviderHelper {
  constructor(private readonly hiperbancoHelper: HiperbancoWebhookHelper) {}

  /**
   * Registra um webhook no provedor especificado.
   */
  async register(
    provider: FinancialProvider,
    dto: RegisterWebhookDto,
    session: ProviderSession,
  ): Promise<RegisterWebhookResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.registerWebhook(dto, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} não suportado`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  /**
   * Lista webhooks do provedor especificado.
   */
  async list(
    provider: FinancialProvider,
    query: ListWebhooksQueryDto,
    session: ProviderSession,
  ): Promise<ListWebhooksResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.listWebhooks(query, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} não suportado`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  /**
   * Atualiza um webhook no provedor especificado.
   */
  async update(
    provider: FinancialProvider,
    webhookId: string,
    dto: UpdateWebhookDto,
    session: ProviderSession,
  ): Promise<UpdateWebhookResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.updateWebhook(webhookId, dto.uri, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} não suportado`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  /**
   * Remove um webhook no provedor especificado.
   */
  async delete(
    provider: FinancialProvider,
    webhookId: string,
    session: ProviderSession,
  ): Promise<void> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.deleteWebhook(webhookId, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} não suportado`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }
}
