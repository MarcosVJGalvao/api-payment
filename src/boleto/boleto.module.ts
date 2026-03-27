import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Boleto } from './entities/boleto.entity';
import { BoletoPayer } from './entities/boleto-payer.entity';
import { BoletoService } from './boleto.service';
import { BoletoController } from './boleto.controller';
import { FinancialProvidersModule } from '../financial-providers/financial-providers.module';
import { BaseQueryModule } from '../common/base-query/base-query.module';
import { AuditModule } from '../common/audit/audit.module';
import { LoggerModule } from '../common/logger/logger.module';
import { BoletoProviderHelper } from './helpers/boleto-provider.helper';
import { BoletoSyncHelper } from './helpers/boleto-sync.helper';
import { HiperbancoBoletoHelper } from './helpers/hiperbanco/hiperbanco-boleto.helper';
import { FinancialProviderPipe } from '@/financial-providers/pipes/financial-provider.pipe';
import {
  BoletoProviderRegistry,
  BOLETO_PROVIDERS,
} from '@/financial-providers/registry/boleto-provider.registry';
import { HiperbancoBoletoProvider } from '@/financial-providers/providers/hiperbanco/hiperbanco-boleto.provider';
import { ClientModule } from '../client/client.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AccountModule } from '../account/account.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Boleto, BoletoPayer]),
    FinancialProvidersModule,
    BaseQueryModule,
    AuditModule,
    LoggerModule,
    ClientModule,
    PermissionsModule,
    AccountModule,
    TransactionModule,
  ],
  controllers: [BoletoController],
  providers: [
    BoletoService,
    BoletoProviderHelper,
    BoletoSyncHelper,
    HiperbancoBoletoHelper,
    HiperbancoBoletoProvider,
    {
      provide: BOLETO_PROVIDERS,
      useFactory: (hiperbanco: HiperbancoBoletoProvider) => [hiperbanco],
      inject: [HiperbancoBoletoProvider],
    },
    BoletoProviderRegistry,
    FinancialProviderPipe,
  ],
  exports: [BoletoService],
})
export class BoletoModule {}
