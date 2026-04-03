import { Injectable } from '@nestjs/common';
import { RedisService } from '@/common/redis/redis.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import {
  ProviderSession,
  isProviderSession,
} from '../contracts/provider-session';
import { v4 as uuidv4 } from 'uuid';
import { RedisKeyPrefixes, RedisPolicies } from '@/queue/redis/redis.config';

@Injectable()
export class ProviderSessionService {
  private readonly context = ProviderSessionService.name;

  constructor(
    private readonly redis: RedisService,
    private readonly logger: AppLoggerService,
  ) {}

  async createSession(
    data: Omit<ProviderSession, 'sessionId' | 'createdAt' | 'expiresAt'>,
  ): Promise<ProviderSession> {
    const sessionId = uuidv4();
    const now = Date.now();

    const session: ProviderSession = {
      ...data,
      sessionId,
      createdAt: now,
      expiresAt: now + RedisPolicies.providerSessionTtlSeconds * 1000,
    };

    const key = `${RedisKeyPrefixes.providerSession}${sessionId}`;
    await this.redis.set(
      key,
      JSON.stringify(session),
      RedisPolicies.providerSessionTtlSeconds,
    );

    this.logger.log(
      `Session created: ${sessionId} for ${data.providerSlug}`,
      this.context,
    );
    return session;
  }

  async getSession(sessionId: string): Promise<ProviderSession | null> {
    const key = `${RedisKeyPrefixes.providerSession}${sessionId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const parsed: unknown = JSON.parse(data);
    if (!isProviderSession(parsed)) {
      this.logger.warn(
        `Invalid provider session payload for ${sessionId}`,
        this.context,
      );
      return null;
    }

    return parsed;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `${RedisKeyPrefixes.providerSession}${sessionId}`;
    await this.redis.del(key);
    this.logger.log(`Session deleted: ${sessionId}`, this.context);
  }

  async refreshSession(sessionId: string): Promise<boolean> {
    const key = `${RedisKeyPrefixes.providerSession}${sessionId}`;
    const exists = await this.redis.exists(key);

    if (!exists) {
      return false;
    }

    await this.redis.expire(key, RedisPolicies.providerSessionTtlSeconds);
    return true;
  }
}
