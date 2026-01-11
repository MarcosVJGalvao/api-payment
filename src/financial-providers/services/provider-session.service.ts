import { Injectable } from '@nestjs/common';
import { RedisService } from '@/common/redis/redis.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import { ProviderSession } from '../hiperbanco/interfaces/provider-session.interface';
import { v4 as uuidv4 } from 'uuid';

const SESSION_PREFIX = 'provider_session:';
const SESSION_TTL_SECONDS = 29 * 60; // 29 minutos

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
      expiresAt: now + SESSION_TTL_SECONDS * 1000,
    };

    const key = `${SESSION_PREFIX}${sessionId}`;
    await this.redis.set(key, JSON.stringify(session), SESSION_TTL_SECONDS);

    this.logger.log(
      `Session created: ${sessionId} for ${data.providerSlug}`,
      this.context,
    );
    return session;
  }

  async getSession(sessionId: string): Promise<ProviderSession | null> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as ProviderSession;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    await this.redis.del(key);
    this.logger.log(`Session deleted: ${sessionId}`, this.context);
  }

  async refreshSession(sessionId: string): Promise<boolean> {
    const key = `${SESSION_PREFIX}${sessionId}`;
    const exists = await this.redis.exists(key);

    if (!exists) {
      return false;
    }

    await this.redis.expire(key, SESSION_TTL_SECONDS);
    return true;
  }
}
