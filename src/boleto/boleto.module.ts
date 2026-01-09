import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Boleto } from './entities/boleto.entity';
import { BoletoService } from './boleto.service';
import { BoletoController } from './boleto.controller';
import { FinancialProvidersModule } from '../financial-providers/financial-providers.module';
import { BaseQueryModule } from '../common/base-query/base-query.module';
import { AuditModule } from '../common/audit/audit.module';
import { LoggerModule } from '../common/logger/logger.module';
import { BoletoProviderHelper } from './helpers/boleto-provider.helper';
import { BoletoSyncHelper } from './helpers/boleto-sync.helper';
import { HiperbancoBoletoHelper } from './helpers/hiperbanco/hiperbanco-boleto.helper';
import { FinancialProviderPipe } from './pipes/financial-provider.pipe';
import { ClientModule } from '../client/client.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AccountModule } from '../account/account.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Boleto]),
        FinancialProvidersModule,
        BaseQueryModule,
        AuditModule,
        LoggerModule,
        ClientModule,
        PermissionsModule,
        AccountModule,
    ],
    controllers: [BoletoController],
    providers: [
        BoletoService,
        BoletoProviderHelper,
        BoletoSyncHelper,
        HiperbancoBoletoHelper,
        FinancialProviderPipe,
    ],
    exports: [BoletoService],
})
export class BoletoModule { }
