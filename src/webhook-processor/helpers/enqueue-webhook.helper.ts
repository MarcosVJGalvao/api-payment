import { Request } from 'express';
import { Queue } from 'bull';
import { WebhookPayload } from '../interfaces/webhook-base.interface';

export interface WebhookJobBase {
  eventType: string;
  events: ReadonlyArray<WebhookPayload<unknown>>;
  clientId: string;
  providerSlug: string;
  validPublicKey: boolean;
}

/**
 * Helper para enfileirar eventos de webhook de forma padronizada.
 * Extrai clientId e validPublicKey do request, define jobId para deduplicação
 * e adiciona à fila Bull.
 */
export async function enqueueWebhookEvent(
  queue: Queue<WebhookJobBase>,
  eventType: WebhookJobBase['eventType'],
  events: WebhookJobBase['events'],
  request: Request,
): Promise<{ received: boolean }> {
  const clientId = request.webhookClientId || '';
  const validPublicKey = request.validPublicKey || false;
  const providerSlug = String(request.params?.provider || '');

  if (!validPublicKey) {
    return { received: true };
  }

  // Usar idempotencyKey do primeiro evento como jobId para deduplicação
  const firstEvent = events.length > 0 ? events[0] : undefined;
  const jobId = firstEvent?.idempotencyKey;

  await queue.add(
    {
      eventType,
      events,
      clientId,
      providerSlug,
      validPublicKey,
    },
    {
      jobId, // Bull rejeita jobs com mesmo ID (deduplicação)
    },
  );

  return { received: true };
}
