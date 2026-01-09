import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly mode: string;

  constructor(
    private configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.mode = this.configService.get<string>('REDIS_MODE', 'local');

    if (this.mode === 'upstash') {
      this.client = this.createUpstashClient();
    } else {
      this.client = this.createLocalClient();
    }
  }

  /**
   * Cria cliente para Upstash Redis (TLS)
   * Utiliza URL de conexão com suporte a TLS obrigatório
   */
  private createUpstashClient(): Redis {
    const upstashUrl = this.configService.get<string>('UPSTASH_REDIS_URL');

    if (!upstashUrl) {
      throw new Error(
        'UPSTASH_REDIS_URL is required when REDIS_MODE=upstash. ' +
          'Get your URL from https://console.upstash.com',
      );
    }


    const client = new Redis(upstashUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Connect only when needed, not during initialization
      connectTimeout: 10000, // 10 seconds timeout
    });

    this.setupErrorHandlers(client);
    return client;
  }

  /**
   * Cria cliente para Redis local (Docker)
   * Configuração tradicional via host/port
   */
  private createLocalClient(): Redis {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const db = this.configService.get<number>('REDIS_DB', 0);


    const client = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.setupErrorHandlers(client);
    return client;
  }

  /**
   * Configura handlers de erro para o cliente Redis
   * Evita que erros de conexão apareçam como "Unhandled error event"
   */
  private setupErrorHandlers(client: Redis): void {
    let lastErrorLog = 0;
    const ERROR_LOG_INTERVAL = 5000; // Log erro a cada 5 segundos no máximo

    client.on('error', (error) => {
      const now = Date.now();
      // Evita spam de logs, registra apenas a cada intervalo
      if (now - lastErrorLog > ERROR_LOG_INTERVAL) {
        this.logger.warn(
          `Redis connection error (mode: ${this.mode}): ${error.message}. Retrying...`,
          'RedisService',
        );
        lastErrorLog = now;
      }
    });

    client.on('connect', () => {
      // Connection event - no log needed
    });

    client.on('ready', () => {
      // Ready event - no log needed
    });

    client.on('close', () => {
      this.logger.warn(
        `Redis connection closed (mode: ${this.mode})`,
        'RedisService',
      );
    });

    client.on('reconnecting', (delay: number) => {
      this.logger.log(
        `Redis reconnecting in ${delay}ms (mode: ${this.mode})...`,
        'RedisService',
      );
    });
  }

  async onModuleInit() {
    try {
      // Try to connect with timeout
      await Promise.race([
        this.client.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 10000),
        ),
      ]);
    } catch (error) {
      this.logger.warn(
        `Redis not available (mode: ${this.mode}): ${error instanceof Error ? error.message : String(error)}. Application will continue without Redis.`,
        'RedisService',
      );
      // Don't throw - allow application to continue without Redis
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.client.setex(key, ttl, value);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    return this.client.mget(...keys);
  }

  async mset(keyValues: Record<string, string>): Promise<'OK'> {
    const entries = Object.entries(keyValues).flat();
    return this.client.mset(...entries);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }
}
