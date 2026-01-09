import { ConfigService } from '@nestjs/config';
import { CloudLoggingProvider } from './cloud-logging.provider';
import { OCILoggingProvider } from './oci/oci-logging.provider';
import { OCILoggingConfig } from './oci/oci-logging.config';
import { AppLoggerService } from '../logger.service';

export type CloudLoggingProviderType = 'oci' | 'aws' | 'gcp' | 'none';

/** Factory para criar instâncias de CloudLoggingProvider */
export class CloudLoggingFactory {
  /**
   * Cria o provider apropriado baseado na configuração
   * @param configService Serviço de configuração do NestJS
   * @param logger Logger para mensagens internas
   * @returns Instância do provider ou null
   */
  static create(
    configService: ConfigService,
    logger?: AppLoggerService,
  ): CloudLoggingProvider | null {
    const providerType = configService
      .get<string>('CLOUD_LOGGING_PROVIDER', 'oci')
      .toLowerCase() as CloudLoggingProviderType;

    switch (providerType) {
      case 'oci':
        return CloudLoggingFactory.createOCIProvider(configService, logger);

      case 'aws':
        process.stdout.write(
          '[CloudLoggingFactory] AWS CloudWatch provider not yet implemented\n',
        );
        return null;

      case 'gcp':
        process.stdout.write(
          '[CloudLoggingFactory] GCP Logging provider not yet implemented\n',
        );
        return null;

      case 'none':
        return null;

      default:
        process.stdout.write(
          `[CloudLoggingFactory] Unknown provider '${providerType}'\n`,
        );
        return null;
    }
  }

  private static createOCIProvider(
    configService: ConfigService,
    logger?: AppLoggerService,
  ): OCILoggingProvider | null {
    const logGroupOcid = configService.get<string>(
      'OCI_LOGGING_LOG_GROUP_OCID',
    );
    const logId = configService.get<string>('OCI_LOGGING_LOG_ID');
    const region =
      configService.get<string>('OCI_REGION') ||
      configService.get<string>('VAULT_REGION') ||
      '';

    if (!logGroupOcid) {
      throw new Error(
        'OCI_LOGGING_LOG_GROUP_OCID is required when CLOUD_LOGGING_PROVIDER=oci',
      );
    }

    if (!region) {
      throw new Error('OCI_REGION is required when CLOUD_LOGGING_PROVIDER=oci');
    }

    if (!logId) {
      throw new Error(
        'OCI_LOGGING_LOG_ID is required when CLOUD_LOGGING_PROVIDER=oci',
      );
    }

    const config: OCILoggingConfig = {
      logGroupOcid,
      logId,
      region,
      compartmentOcid: configService.get<string>(
        'OCI_LOGGING_COMPARTMENT_OCID',
      ),
      configFile: configService.get<string>('OCI_CONFIG_FILE'),
      profile: configService.get<string>('OCI_PROFILE'),
    };

    return new OCILoggingProvider(config, logger);
  }

  /**
   * Cria provider para uso standalone (seeds, migrations)
   * @param providerType Tipo do provider
   * @returns Instância do provider ou null
   */
  static createStandalone(
    providerType: CloudLoggingProviderType = 'oci',
  ): CloudLoggingProvider | null {
    if (providerType === 'none') return null;

    if (providerType !== 'oci') {
      process.stdout.write(
        `[CloudLoggingFactory] Provider '${providerType}' not implemented for standalone\n`,
      );
      return null;
    }

    const logGroupOcid = process.env.OCI_LOGGING_LOG_GROUP_OCID;
    const logId = process.env.OCI_LOGGING_LOG_ID;
    const region = process.env.OCI_REGION || process.env.VAULT_REGION || '';

    if (!logGroupOcid || !logId || !region) return null;

    const config: OCILoggingConfig = {
      logGroupOcid,
      logId,
      region,
      compartmentOcid: process.env.OCI_LOGGING_COMPARTMENT_OCID,
      configFile: process.env.OCI_CONFIG_FILE,
      profile: process.env.OCI_PROFILE,
    };

    return new OCILoggingProvider(config);
  }
}
