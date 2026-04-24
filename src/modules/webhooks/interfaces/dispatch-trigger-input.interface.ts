import type { WebhookEvent } from '@/webhook-processor/enums/webhook-event.enum';
import type { WebhookPayload } from '@/webhook-processor/interfaces/webhook-base.interface';

export interface DispatchTriggerInput {
  clientId: string;
  providerEventName: WebhookEvent;
  events: ReadonlyArray<WebhookPayload<unknown>>;
  providerSlug: string;
  correlationId?: string;
}
