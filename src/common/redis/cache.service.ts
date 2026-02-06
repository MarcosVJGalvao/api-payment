import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import { getErrorMessage } from '@/common/helpers/exception.helper';

@Injectable()
export class CacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Obtém um valor do cache e faz o parse do JSON
   * @param key Chave do cache
   */
  async get<T>(
    key: string,
    validator: (value: unknown) => value is T,
  ): Promise<T | null>;
  async get(key: string): Promise<unknown | null>;
  async get<T>(
    key: string,
    validator?: (value: unknown) => value is T,
  ): Promise<T | unknown | null> {
    try {
      const value = await this.redisService.get(key);
      if (!value) {
        return null;
      }
      const parsed: unknown = JSON.parse(value);
      if (!validator) {
        return parsed;
      }
      return validator(parsed) ? parsed : null;
    } catch (error) {
      this.logger.warn(
        `Failed to get/parse cache key ${key}: ${getErrorMessage(error)}`,
        'CacheService',
      );
      return null;
    }
  }

  /**
   * Salva um valor no cache serializado em JSON
   * @param key Chave do cache
   * @param value Valor a ser salvo
   * @param ttlSeconds Tempo de vida em segundos (opcional)
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.redisService.set(key, stringValue, ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Failed to set cache key ${key}: ${getErrorMessage(error)}`,
        'CacheService',
      );
    }
  }

  /**
   * Remove uma chave do cache
   * @param key Chave a ser removida
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
    } catch (error) {
      this.logger.warn(
        `Failed to delete cache key ${key}: ${getErrorMessage(error)}`,
        'CacheService',
      );
    }
  }

  /**
   * Invalida chaves por padrão (pattern)
   * @param pattern Padrão de chaves a remover (ex: 'users:*')
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisService.keys(pattern);
      if (keys.length > 0) {
        const pipeline = this.redisService.getClient().pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate pattern ${pattern}: ${getErrorMessage(error)}`,
        'CacheService',
      );
    }
  }
}
