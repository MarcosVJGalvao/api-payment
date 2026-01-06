import * as winston from 'winston';
import * as dotenv from 'dotenv';
import { CloudLoggingTransport } from './cloud-logging.transport';
import { CloudLoggingFactory, CloudLoggingProviderType } from './providers/cloud-logging.factory';
import { createLoggerFormat } from './helpers/logger-format.helper';

dotenv.config({ debug: false });
process.env.DOTENVX_QUIET = 'true';

/**
 * Cria uma instância standalone do logger para uso em scripts (seeds, migrations, etc.)
 * Não requer injeção de dependência do NestJS
 */
export function createStandaloneLogger(): winston.Logger {
    const isProduction = process.env.NODE_ENV === 'production';
    const format = createLoggerFormat(isProduction);

    const logDestination = process.env.LOG_DESTINATION || 'console';
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
    if (logDestination === 'cloud' || logDestination === 'both' || logDestination === 'oci') {
        const providerType = (process.env.CLOUD_LOGGING_PROVIDER || 'oci') as CloudLoggingProviderType;

        try {
            const cloudProvider = CloudLoggingFactory.createStandalone(providerType);

            if (cloudProvider) {
                transports.push(
                    new CloudLoggingTransport({
                        cloudLoggingProvider: cloudProvider,
                    }),
                );
            } else {
                // Fallback para console se cloud provider não configurado
                process.stdout.write(
                    '[Standalone Logger] Cloud logging requested but provider not configured, using console only\n',
                );
                if (transports.length === 0) {
                    transports.push(
                        new winston.transports.Console({
                            format: format,
                        }),
                    );
                }
            }
        } catch (error) {
            // Se falhar, fallback para console
            process.stdout.write(
                `[Standalone Logger] Failed to initialize cloud logging, using console only: ${error instanceof Error ? error.message : String(error)}\n`,
            );
            if (transports.length === 0) {
                transports.push(
                    new winston.transports.Console({
                        format: format,
                    }),
                );
            }
        }
    }

    // Garantir ao menos um transport
    if (transports.length === 0) {
        transports.push(
            new winston.transports.Console({
                format: format,
            }),
        );
    }

    return winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format,
        transports,
    });
}
