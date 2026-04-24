import { HttpService } from '@nestjs/axios';
import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bull';
import { firstValueFrom } from 'rxjs';
import { WebhookHmacSigningService } from '../services/webhook-hmac-signing.service';
import { WebhookMessageRepository } from '../repositories/webhook-message.repository';
import { WebhookConfigurationRepository } from '../repositories/webhook-configuration.repository';
import { OutboundWebhookMessageStatus } from '../enums/outbound-webhook-message-status.enum';
import type { OutboundDeliveryJob } from '../interfaces/outbound-delivery-job.interface';
import { getErrorMessage } from '@/common/helpers/exception.helper';

@Injectable()
@Processor('webhook-outbound-delivery')
export class OutboundWebhookDeliveryProcessor {
  private readonly logger = new Logger(OutboundWebhookDeliveryProcessor.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly hmacSigningService: WebhookHmacSigningService,
    private readonly messageRepository: WebhookMessageRepository,
    private readonly configRepository: WebhookConfigurationRepository,
    private readonly configService: ConfigService,
  ) {}

  @Process()
  async handleJob(job: Job<OutboundDeliveryJob>): Promise<void> {
    const { webhookMessageId, url, publicKey, privateKey, payload, eventType } =
      job.data;

    const message = await this.messageRepository.findById(webhookMessageId);
    if (!message) {
      this.logger.warn(`WebhookMessage ${webhookMessageId} not found, skipping`);
      return;
    }

    if (message.status === OutboundWebhookMessageStatus.DELIVERED) {
      this.logger.log(
        `WebhookMessage ${webhookMessageId} already delivered, skipping`,
      );
      return;
    }

    const config = await this.configRepository.findById(job.data.configurationId);
    if (config?.circuitBreakerOpenUntil && config.circuitBreakerOpenUntil > new Date()) {
      await this.messageRepository.updateStatus(
        webhookMessageId,
        OutboundWebhookMessageStatus.CIRCUIT_OPEN,
        { lastAttemptedAt: new Date() },
      );
      this.logger.warn(
        `Circuit breaker open for config ${job.data.configurationId}, message ${webhookMessageId} set to CIRCUIT_OPEN`,
      );
      return;
    }

    const rawBody = JSON.stringify(payload);
    const { authorization, timestamp, nonce } = this.hmacSigningService.sign(
      url,
      rawBody,
      publicKey,
      privateKey,
    );

    const timeoutMs = this.configService.get<number>(
      'OUTBOUND_WEBHOOK_TIMEOUT_MS',
      10000,
    );

    let responseStatus: number | undefined;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: authorization,
            'X-Webhook-Timestamp': timestamp,
            'X-Webhook-Nonce': nonce,
            'X-Webhook-Event': eventType,
            'X-Webhook-Delivery-Id': webhookMessageId,
          },
          timeout: timeoutMs,
        }),
      );
      responseStatus = response.status;

      await this.messageRepository.updateStatus(
        webhookMessageId,
        OutboundWebhookMessageStatus.DELIVERED,
        {
          deliveredAt: new Date(),
          lastAttemptedAt: new Date(),
          attemptCount: (message.attemptCount ?? 0) + 1,
          responseStatusCode: responseStatus,
          lastError: null,
        },
      );

      if (config) {
        await this.configRepository.update(config.id, {
          circuitBreakerFailureCount: 0,
          circuitBreakerOpenUntil: null,
        });
      }

      this.logger.log(
        `Delivered webhook message ${webhookMessageId} → ${url} [${responseStatus}]`,
      );
    } catch (error) {
      responseStatus =
        (error as any)?.response?.status ?? (error as any)?.status ?? undefined;

      const errorMessage = getErrorMessage(error);

      await this.messageRepository.updateStatus(
        webhookMessageId,
        OutboundWebhookMessageStatus.PENDING,
        {
          lastAttemptedAt: new Date(),
          attemptCount: (message.attemptCount ?? 0) + 1,
          responseStatusCode: responseStatus ?? null,
          lastError: errorMessage,
        },
      );

      if (config) {
        const newFailureCount = (config.circuitBreakerFailureCount ?? 0) + 1;
        const threshold = this.configService.get<number>(
          'OUTBOUND_WEBHOOK_CIRCUIT_BREAKER_THRESHOLD',
          5,
        );
        const openDurationMs = this.configService.get<number>(
          'OUTBOUND_WEBHOOK_CIRCUIT_BREAKER_OPEN_DURATION_MS',
          300000,
        );

        const updateData: any = { circuitBreakerFailureCount: newFailureCount };
        if (newFailureCount >= threshold) {
          updateData.circuitBreakerOpenUntil = new Date(
            Date.now() + openDurationMs,
          );
          this.logger.warn(
            `Circuit breaker opened for config ${config.id} after ${newFailureCount} failures`,
          );
        }
        await this.configRepository.update(config.id, updateData);
      }

      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job<OutboundDeliveryJob>, error: Error): Promise<void> {
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 5);
    if (!isLastAttempt) return;

    await this.messageRepository.updateStatus(
      job.data.webhookMessageId,
      OutboundWebhookMessageStatus.FAILED,
      {
        lastError: error.message,
        lastAttemptedAt: new Date(),
      },
    );

    this.logger.error(
      `WebhookMessage ${job.data.webhookMessageId} FAILED after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }
}
