import { Injectable, LoggerService, Optional, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { CloudLoggingTransport } from './cloud-logging.transport';
import type { CloudLoggingProvider } from './providers/cloud-logging.provider';
import { createLoggerFormat } from './helpers/logger-format.helper';

export const CLOUD_LOGGING_PROVIDER = 'CLOUD_LOGGING_PROVIDER';

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor(
    private configService: ConfigService,
    @Optional()
    @Inject(CLOUD_LOGGING_PROVIDER)
    private cloudLoggingProvider?: CloudLoggingProvider,
  ) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const format = createLoggerFormat(isProduction);

    const logDestination = this.configService.get<string>(
      'LOG_DESTINATION',
      'console',
    );
    const transports: winston.transport[] = [];

    // Adicionar console transport se necessário
    if (logDestination === 'console' || logDestination === 'both') {
      transports.push(
        new winston.transports.Console({
          format: format,
        }),
      );
    }

    // Adicionar cloud transport se necessário
    if (
      (logDestination === 'cloud' ||
        logDestination === 'both' ||
        logDestination === 'oci') &&
      this.cloudLoggingProvider
    ) {
      transports.push(
        new CloudLoggingTransport({
          cloudLoggingProvider: this.cloudLoggingProvider,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      format,
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  logWithContext(
    level: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
    message: string,
    meta?: Record<string, any>,
    context?: string,
  ) {
    // Preserva todos os metadados - usado por HttpExceptionFilter
    // e contém request, response, statusCode, stack, etc.
    // Mapeia 'log' para 'info' já que Winston não tem nível 'log'
    const winstonLevel = level === 'log' ? 'info' : level;
    this.logger[winstonLevel](message, { ...meta, context });
  }
}
