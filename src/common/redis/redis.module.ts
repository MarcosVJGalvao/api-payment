import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { RedisThrottlerStorage } from './throttler-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, RedisThrottlerStorage, CacheService],
  exports: [RedisService, RedisThrottlerStorage, CacheService],
})
export class RedisModule {}
