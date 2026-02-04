import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { typeOrmConfig } from './typeorm.config';
import { LogCleanupService } from './services/log-cleanup.service';
import { WebhookEventLog } from '@/webhook-processor/entities/webhook-event-log.entity';
import { AuditLog } from '@/common/audit/entities/audit-log.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        typeOrmConfig(configService),
    }),
    TypeOrmModule.forFeature([WebhookEventLog, AuditLog]),
  ],
  providers: [LogCleanupService],
})
export class DatabaseModule {}
