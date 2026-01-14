import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Interface para criação de log de evento de webhook.
 */
export interface ICreateWebhookEventLog {
  authenticationCode: string;
  entityType: string;
  entityId?: string;
  eventName: string;
  wasProcessed: boolean;
  skipReason?: string;
  payload?: Record<string, unknown>;
  providerTimestamp?: Date;
  clientId: string;
}

/**
 * DTO para criação de log de evento de webhook.
 */
export class CreateWebhookEventLogDto implements ICreateWebhookEventLog {
  @IsString()
  authenticationCode: string;

  @IsString()
  entityType: string;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsString()
  eventName: string;

  @IsBoolean()
  wasProcessed: boolean;

  @IsString()
  @IsOptional()
  skipReason?: string;

  @IsOptional()
  payload?: Record<string, unknown>;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  providerTimestamp?: Date;

  @IsUUID()
  clientId: string;
}
