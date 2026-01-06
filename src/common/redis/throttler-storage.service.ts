import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { RedisService } from './redis.service';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttler:${throttlerName}:${key}`;
    const ttlSeconds = Math.ceil(ttl / 1000);
    const blockTtlSeconds = Math.ceil(blockDuration / 1000);

    const count = await this.redisService.incr(redisKey);

    if (count === 1) {
      await this.redisService.expire(redisKey, ttlSeconds);
    }

    const timeToExpire = await this.redisService.ttl(redisKey);
    const isBlocked = count > limit;

    return {
      totalHits: count,
      timeToExpire: timeToExpire > 0 ? timeToExpire : ttlSeconds,
      isBlocked,
      timeToBlockExpire: isBlocked ? blockTtlSeconds : 0,
    };
  }
}
