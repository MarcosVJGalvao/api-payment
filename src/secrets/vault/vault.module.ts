import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VaultService } from './vault.service';
import { LoggerModule } from '@/common/logger/logger.module';
import { AppLoggerService } from '@/common/logger/logger.service';
import { VaultConfig } from './vault.config';

@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [
    {
      provide: VaultService,
      useFactory: (
        configService: ConfigService,
        logger: AppLoggerService,
      ) => {
        // Use OCI_REGION with fallback to VAULT_REGION for compatibility
        const region =
          configService.get<string>('OCI_REGION') ||
          configService.get<string>('VAULT_REGION') ||
          '';

        const vaultConfig: VaultConfig = {
          vaultOcid: configService.get<string>('VAULT_OCID') || '',
          region: region,
          configFile: configService.get<string>('OCI_CONFIG_FILE'),
          profile: configService.get<string>('OCI_PROFILE'),
        };
        return new VaultService(vaultConfig, logger);
      },
      inject: [ConfigService, AppLoggerService],
    },
  ],
  exports: [VaultService],
})
export class VaultModule {}

