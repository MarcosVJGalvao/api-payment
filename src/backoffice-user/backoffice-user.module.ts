import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BackofficeUser } from './entities/backoffice-user.entity';
import { BackofficeUserService } from './services/backoffice-user.service';
import { BackofficeAuthService } from './services/backoffice-auth.service';
import { BackofficeJwtStrategy } from './strategies/backoffice-jwt.strategy';
import { InternalUserModule } from '@/internal-user/internal-user.module';
import { BackofficeOrInternalGuard } from './guards/backoffice-or-internal.guard';
import { BackofficeAuthGuard } from './guards/backoffice-auth.guard';
import { BackofficeUserController } from './backoffice-user.controller';
import { BackofficeAuthController } from './backoffice-auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BackofficeUser]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    InternalUserModule,
  ],
  controllers: [BackofficeUserController, BackofficeAuthController],
  providers: [
    BackofficeUserService,
    BackofficeAuthService,
    BackofficeJwtStrategy,
    BackofficeAuthGuard,
    BackofficeOrInternalGuard,
  ],
  exports: [BackofficeUserService],
})
export class BackofficeUserModule {}
