import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
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
import { BillPaymentModule } from './bill-payment/bill-payment.module';
import { PixModule } from './pix/pix.module';
import { ClientModule } from './client/client.module';
import { InternalUserModule } from './internal-user/internal-user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { bullConfigFactory } from './config/bull.config';
import { TransactionModule } from './transaction/transaction.module';
import { WebhookProcessorModule } from './webhook-processor/webhook-processor.module';
import { TedModule } from './ted/ted.module';

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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullConfigFactory,
      inject: [ConfigService],
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    FinancialProvidersModule,
    WebhookModule,
    BoletoModule,
    BillPaymentModule,
    PixModule,
    ClientModule,
    InternalUserModule,
    TransactionModule,
    WebhookProcessorModule,
    TedModule,
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
