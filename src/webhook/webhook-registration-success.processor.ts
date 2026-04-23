import { HttpService } from '@nestjs/axios';
import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bull';
import { randomUUID, createHmac } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { AppLoggerService } from '@/common/logger/logger.service';
import {
  WebhookRegistrationSuccessJob,
  WebhookRegistrationSuccessPayload,
} from './interfaces/webhook-registration-success-job.interface';

@Injectable()
@Processor('webhook-registration-success')
export class WebhookRegistrationSuccessProcessor {
  private readonly context = WebhookRegistrationSuccessProcessor.name;

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {}

  @Process()
  async handle(job: Job<WebhookRegistrationSuccessJob>): Promise<void> {
    const { callbackUri, callbackSecret, payload, webhookId } = job.data;
    if (!callbackUri) {
      this.logger.warn(
        `Skipping registration success webhook delivery because callback URI is missing (webhookId=${webhookId})`,
        this.context,
      );
      return;
    }

    const timestamp = new Date().toISOString();
    const body = JSON.stringify(payload);
    const deliveryId = randomUUID();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Delivery-Id': deliveryId,
    };

    const signature = this.signPayload(body, timestamp, callbackSecret);
    if (signature) {
      headers['X-Webhook-Signature'] = signature;
    }

    await firstValueFrom(
      this.httpService.post<WebhookRegistrationSuccessPayload>(
        callbackUri,
        payload,
        {
          headers,
          timeout: 10000,
        },
      ),
    );

    this.logger.log(
      `Webhook registration success delivered (webhookId=${webhookId}, deliveryId=${deliveryId})`,
      this.context,
    );
  }

  private signPayload(
    body: string,
    timestamp: string,
    callbackSecret?: string | null,
  ): string | null {
    if (!callbackSecret) {
      return null;
    }
    return createHmac('sha256', callbackSecret)
      .update(`${timestamp}.${body}`)
      .digest('hex');
  }
}
