import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './common/logger/logger.module';
import { DocsModule } from './swagger/docs.module';
import { BaseQueryModule } from './common/base-query/base-query.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuditModule } from './common/audit/audit.module';
import { FinancialProvidersModule } from './financial-providers/financial-providers.module';
import { WebhookModule } from './webhook/webhook.module';
import { BoletoModule } from './boleto/boleto.module';
import { ClientModule } from './client/client.module';
import { InternalUserModule } from './internal-user/internal-user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    DocsModule,
    BaseQueryModule,
    DatabaseModule,
    RedisModule,
    PermissionsModule,
    AuditModule,
    FinancialProvidersModule,
    WebhookModule,
    BoletoModule,
    ClientModule,
    InternalUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}