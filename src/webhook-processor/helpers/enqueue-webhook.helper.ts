import { Request } from 'express';
import { Queue } from 'bull';
import { WebhookPayload } from '../interfaces/webhook-base.interface';

interface WebhookJobBase {
  eventType: string;
  events: ReadonlyArray<WebhookPayload<unknown>>;
  clientId: string;
  validPublicKey: boolean;
}

/**
 * Helper para enfileirar eventos de webhook de forma padronizada.
 * Extrai clientId e validPublicKey do request, define jobId para deduplicação
 * e adiciona à fila Bull.
 */
export async function enqueueWebhookEvent<TJob extends WebhookJobBase>(
  queue: Queue<TJob>,
  eventType: TJob['eventType'],
  events: TJob['events'],
  request: Request,
): Promise<{ received: boolean }> {
  const clientId = request.webhookClientId || '';
  const validPublicKey = request.validPublicKey || false;

  // Usar idempotencyKey do primeiro evento como jobId para deduplicação
  const firstEvent = events.length > 0 ? events[0] : undefined;
  const jobId = firstEvent?.idempotencyKey;

  await queue.add(
    {
      eventType,
      events,
      clientId,
      validPublicKey,
    } as TJob, // Cast seguro pois montamos objeto compatível com a interface base
    {
      jobId, // Bull rejeita jobs com mesmo ID (deduplicação)
    },
  );

  return { received: true };
}
