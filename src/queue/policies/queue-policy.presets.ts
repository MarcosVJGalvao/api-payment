import { BullModuleOptions } from '@nestjs/bull';
import {
  DEFAULT_QUEUE_ATTEMPTS,
  DEFAULT_QUEUE_DELAY_MS,
  DEFAULT_RETRY_DELAY_MS,
  WEBHOOK_EVENT_QUEUE_ATTEMPTS,
  WEBHOOK_EVENT_RETRY_DELAY_MS,
} from '../constants/queue.constants';
import { RedisPolicies } from '../redis/redis.config';

export const RETAIN_ON_FAILURE = {
  age: RedisPolicies.auditFailureRetentionSeconds,
};

export const REMOVE_IMMEDIATELY = true;

export const webhookEventQueueOptions: Omit<BullModuleOptions, 'name'> = {
  defaultJobOptions: {
    attempts: WEBHOOK_EVENT_QUEUE_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: WEBHOOK_EVENT_RETRY_DELAY_MS,
    },
    removeOnComplete: REMOVE_IMMEDIATELY,
    removeOnFail: REMOVE_IMMEDIATELY,
  },
};

export const BaseBullDefaultJobOptions: BullModuleOptions['defaultJobOptions'] =
  {
    attempts: DEFAULT_QUEUE_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: DEFAULT_RETRY_DELAY_MS,
    },
    removeOnComplete: REMOVE_IMMEDIATELY,
    removeOnFail: RETAIN_ON_FAILURE,
    delay: DEFAULT_QUEUE_DELAY_MS,
  };
