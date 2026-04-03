import { BullModuleOptions } from '@nestjs/bull';
import { IMMEDIATE_DELAY_MS } from '../constants/queue.constants';
import { QueuePolicies } from './queue-policy.catalog';
import { BaseBullDefaultJobOptions } from './queue-policy.presets';

export function getQueueConfig(
  queueName: keyof typeof QueuePolicies,
): BullModuleOptions {
  return QueuePolicies[queueName];
}

export function getBullDefaultJobOptions() {
  return BaseBullDefaultJobOptions;
}

export const JobOptions = {
  IMMEDIATE: { delay: IMMEDIATE_DELAY_MS },
};

export const AuditQueueAddOptions = {
  removeOnComplete: QueuePolicies.audit.defaultJobOptions.removeOnComplete,
  removeOnFail: QueuePolicies.audit.defaultJobOptions.removeOnFail,
};
