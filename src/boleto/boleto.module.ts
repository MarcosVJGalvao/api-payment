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
import { HiperbancoBoletoHelper } from './helpers/hiperbanco/hiperbanco-boleto.helper';
import { FinancialProviderPipe } from './pipes/financial-provider.pipe';

@Module({
    imports: [
        TypeOrmModule.forFeature([Boleto]),
        FinancialProvidersModule,
        BaseQueryModule,
        AuditModule,
        LoggerModule,
    ],
    controllers: [BoletoController],
    providers: [
        BoletoService,
        BoletoProviderHelper,
        HiperbancoBoletoHelper,
        FinancialProviderPipe,
    ],
    exports: [BoletoService],
})
export class BoletoModule { }
