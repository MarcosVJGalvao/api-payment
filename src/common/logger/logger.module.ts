import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppLoggerService, CLOUD_LOGGING_PROVIDER } from './logger.service';
import { CloudLoggingFactory } from './providers/cloud-logging.factory';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CLOUD_LOGGING_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const logDestination = configService.get<string>(
          'LOG_DESTINATION',
          'console',
        );

        if (
          logDestination === 'cloud' ||
          logDestination === 'both' ||
          logDestination === 'oci'
        ) {
          const providerType = configService.get<string>(
            'CLOUD_LOGGING_PROVIDER',
            'oci',
          );
          process.stdout.write(
            `📊  Cloud Logging enabled (destination: ${logDestination}, provider: ${providerType})\n`,
          );

          return CloudLoggingFactory.create(configService);
        }

        process.stdout.write(`📊  Logging enabled (destination: console)\n`);
        return null;
      },
      inject: [ConfigService],
    },
    AppLoggerService,
  ],
  exports: [AppLoggerService],
})
export class LoggerModule {}
