import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { WebhookEventLog } from '../entities/webhook-event-log.entity';
import { CreateWebhookEventLogDto } from '../dto/create-webhook-event-log.dto';

/**
 * Serviço para gerenciar logs de eventos de webhook.
 * Suporta auditoria e validação de sequência.
 */
@Injectable()
export class WebhookEventLogService {
  private readonly logger = new Logger(WebhookEventLogService.name);

  /** Período de retenção de logs em dias */
  private readonly RETENTION_DAYS = 60;

  constructor(
    @InjectRepository(WebhookEventLog)
    private readonly repository: Repository<WebhookEventLog>,
  ) {}

  /**
   * Busca o último evento processado para uma transação.
   * @param authenticationCode - Código de autenticação da transação
   * @returns Nome do último evento ou null se não houver
   */
  async getLastProcessedEvent(
    authenticationCode: string,
  ): Promise<string | null> {
    const lastLog = await this.repository.findOne({
      where: {
        authenticationCode,
        wasProcessed: true,
      },
      order: { createdAt: 'DESC' },
    });

    return lastLog?.eventName || null;
  }

  /**
   * Busca o último evento processado para uma transação de um cliente específico.
   * @param authenticationCode - Código de autenticação da transação
   * @param clientId - ID do cliente
   * @returns Nome do último evento ou null se não houver
   */
  async getLastProcessedEventByClient(
    authenticationCode: string,
    clientId: string,
  ): Promise<string | null> {
    const lastLog = await this.repository.findOne({
      where: {
        authenticationCode,
        clientId,
        wasProcessed: true,
      },
      order: { createdAt: 'DESC' },
    });

    return lastLog?.eventName || null;
  }

  /**
   * Registra um evento de webhook.
   * @param data - Dados do evento
   * @returns Log criado
   */
  async logEvent(data: CreateWebhookEventLogDto): Promise<WebhookEventLog> {
    const log = this.repository.create(data);
    const saved = await this.repository.save(log);

    if (!data.wasProcessed) {
      this.logger.warn(
        `Webhook event skipped: ${data.eventName} for ${data.authenticationCode} - ${data.skipReason}`,
      );
    } else {
      this.logger.debug(
        `Webhook event logged: ${data.eventName} for ${data.authenticationCode}`,
      );
    }

    return saved;
  }

  /**
   * Busca logs de um cliente específico.
   * @param clientId - ID do cliente
   * @param authenticationCode - Código de autenticação (opcional)
   * @returns Lista de logs
   */
  async findByClient(
    clientId: string,
    authenticationCode?: string,
  ): Promise<WebhookEventLog[]> {
    const where: Record<string, unknown> = { clientId };

    if (authenticationCode) {
      where.authenticationCode = authenticationCode;
    }

    return this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Limpa logs com mais de 60 dias.
   * Deve ser chamado pelo scheduler.
   * @returns Número de registros deletados
   */
  async cleanupOldLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    const result = await this.repository.delete({
      createdAt: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  /**
   * Verifica se existe algum log para um código de autenticação.
   * @param authenticationCode - Código de autenticação
   * @returns true se existir pelo menos um log
   */
  async hasLogs(authenticationCode: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { authenticationCode },
    });
    return count > 0;
  }
}
