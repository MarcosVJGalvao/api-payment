import { ConfigService } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

// Opções predefinidas para jobs
export const JobOptions = {
  IMMEDIATE: { delay: 0 },
};

export const bullConfigFactory = (
  configService: ConfigService,
): BullModuleOptions => {
  const redisMode = configService.get('REDIS_MODE', 'local');

  const defaultJobOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      age: 24 * 3600, // 24 hours
    },
    // Delay global de 5 segundos (pode ser sobrescrito com 0 para execução imediata)
    delay: 5000,
  };

  // Upstash Redis (TLS via URL)
  if (redisMode === 'upstash') {
    const upstashUrl = configService.get<string>('UPSTASH_REDIS_URL');
    if (!upstashUrl) {
      throw new Error('UPSTASH_REDIS_URL is required when REDIS_MODE=upstash');
    }

    // Parse URL to extract components for Bull
    const url = new URL(upstashUrl);
    return {
      redis: {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        tls: { rejectUnauthorized: false },
        maxRetriesPerRequest: 3,
      },
      defaultJobOptions,
    };
  }

  // Local Redis (Docker)
  return {
    redis: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: 3,
    },
    defaultJobOptions,
  };
};
