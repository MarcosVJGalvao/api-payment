import { BullModuleOptions } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_MAX_RETRIES_PER_REQUEST,
  DEFAULT_REDIS_PORT,
  REDIS_MODE_LOCAL,
  REDIS_MODE_UPSTASH,
  UPSTASH_DEFAULT_PORT,
} from '../constants/queue.constants';
import { getBullDefaultJobOptions } from '../policies/queue-policy.accessors';

function getRedisConnection(configService: ConfigService) {
  const redisMode = configService.get('REDIS_MODE', REDIS_MODE_LOCAL);

  if (redisMode === REDIS_MODE_UPSTASH) {
    const upstashUrl = configService.get<string>('UPSTASH_REDIS_URL');
    if (!upstashUrl) {
      throw new Error('UPSTASH_REDIS_URL is required when REDIS_MODE=upstash');
    }

    const url = new URL(upstashUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || UPSTASH_DEFAULT_PORT, 10),
      password: url.password || undefined,
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: DEFAULT_MAX_RETRIES_PER_REQUEST,
    };
  }

  return {
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get('REDIS_PORT', DEFAULT_REDIS_PORT),
    password: configService.get('REDIS_PASSWORD') || undefined,
    maxRetriesPerRequest: DEFAULT_MAX_RETRIES_PER_REQUEST,
  };
}

export const bullConfigFactory = (
  configService: ConfigService,
): BullModuleOptions => ({
  redis: getRedisConnection(configService),
  defaultJobOptions: getBullDefaultJobOptions(),
});
