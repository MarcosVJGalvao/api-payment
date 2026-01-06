import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ProviderCredential } from './entities/provider-credential.entity';
import { FinancialCredentialsService } from './services/financial-credentials.service';
import { ProviderSessionService } from './services/provider-session.service';
import { ProviderJwtService } from './services/provider-jwt.service';
import { HiperbancoHttpService } from './hiperbanco/hiperbanco-http.service';
import { HiperbancoAuthService } from './hiperbanco/hiperbanco-auth.service';
import { ProviderAuthGuard } from './guards/provider-auth.guard';
import { FinancialProvidersController } from './financial-providers.controller';
import { LoggerModule } from '../common/logger/logger.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProviderCredential]),
        HttpModule,
        JwtModule.register({}),
        LoggerModule,
        RedisModule,
    ],
    controllers: [FinancialProvidersController],
    providers: [
        FinancialCredentialsService,
        ProviderSessionService,
        ProviderJwtService,
        HiperbancoHttpService,
        HiperbancoAuthService,
        ProviderAuthGuard,
    ],
    exports: [
        FinancialCredentialsService,
        ProviderSessionService,
        ProviderJwtService,
        HiperbancoHttpService,
        HiperbancoAuthService,
        ProviderAuthGuard,
    ],
})
export class FinancialProvidersModule { }
