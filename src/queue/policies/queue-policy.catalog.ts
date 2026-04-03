import {
  AUDIT_QUEUE_DELAY_MS,
  DEFAULT_QUEUE_ATTEMPTS,
  DEFAULT_QUEUE_DELAY_MS,
  DEFAULT_RETRY_DELAY_MS,
  WEBHOOK_REGISTRATION_RETRY_DELAY_MS,
} from '../constants/queue.constants';
import { RedisPolicies } from '../redis/redis.config';
import {
  REMOVE_IMMEDIATELY,
  webhookEventQueueOptions,
} from './queue-policy.presets';

export const QueuePolicies = {
  audit: {
    name: 'audit',
    defaultJobOptions: {
      attempts: DEFAULT_QUEUE_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: DEFAULT_RETRY_DELAY_MS,
      },
      removeOnComplete: REMOVE_IMMEDIATELY,
      removeOnFail: {
        age: RedisPolicies.auditFailureRetentionSeconds,
      },
      delay: AUDIT_QUEUE_DELAY_MS,
    },
  },
  webhookRegistration: {
    name: 'webhook',
    defaultJobOptions: {
      attempts: DEFAULT_QUEUE_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: WEBHOOK_REGISTRATION_RETRY_DELAY_MS,
      },
      removeOnComplete: REMOVE_IMMEDIATELY,
      removeOnFail: REMOVE_IMMEDIATELY,
      delay: DEFAULT_QUEUE_DELAY_MS,
    },
  },
  webhookBillPayment: {
    name: 'webhook-bill-payment',
    ...webhookEventQueueOptions,
  },
  webhookBoleto: {
    name: 'webhook-boleto',
    ...webhookEventQueueOptions,
  },
  webhookPix: {
    name: 'webhook-pix',
    ...webhookEventQueueOptions,
  },
  webhookTed: {
    name: 'webhook-ted',
    ...webhookEventQueueOptions,
  },
};
