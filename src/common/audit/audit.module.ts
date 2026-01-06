import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditCleanupService } from './services/audit-cleanup.service';
import { AuditExportService } from './services/audit-export.service';
import { AuditDashboardService } from './services/audit-dashboard.service';
import { AuditAlertService } from './services/audit-alert.service';
import { AuditController } from './controllers/audit.controller';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { PermissionsModule } from '@/permissions/permissions.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    PermissionsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        return {
          secret: secret || 'default-secret',
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuditController],
  providers: [
    AuditLogRepository,
    AuditService,
    AuditCleanupService,
    AuditExportService,
    AuditDashboardService,
    AuditAlertService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [
    AuditLogRepository,
    AuditService,
    AuditCleanupService,
    AuditExportService,
    AuditDashboardService,
    AuditAlertService,
  ],
})
export class AuditModule { }
