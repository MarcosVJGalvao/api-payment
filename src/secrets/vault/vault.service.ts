import { Injectable } from '@nestjs/common';
import * as common from 'oci-common';
import * as secretsmanagement from 'oci-secrets';
import * as path from 'path';
import * as os from 'os';
import { AppLoggerService } from '@/common/logger/logger.service';
import type { VaultConfig, SecretCache } from './vault.config';

interface SecretBundleResponse {
  secretBundle?: {
    secretBundleContent?: {
      content?: string;
      contentType?: string;
    };
  };
}

@Injectable()
export class VaultService {
  private secretsClient: secretsmanagement.SecretsClient | null = null;
  private initializationPromise: Promise<void> | null = null;
  private cache: SecretCache = {};
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    private readonly config: VaultConfig,
    private readonly logger?: AppLoggerService,
  ) { }

  private async initializeClient(): Promise<void> {
    if (this.secretsClient) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        let authenticationDetailsProvider: common.AuthenticationDetailsProvider;

        try {
          const builder = new (common as any).InstancePrincipalsAuthenticationDetailsProviderBuilder();
          authenticationDetailsProvider = await builder.build();
        } catch {
          let configFile = this.config.configFile || '~/.oci/config';
          const profile = this.config.profile || 'DEFAULT';

          if (configFile.startsWith('~')) {
            const homeDir = os.homedir();
            configFile = path.join(homeDir, configFile.slice(1));
          }

          authenticationDetailsProvider =
            new common.ConfigFileAuthenticationDetailsProvider(
              configFile,
              profile,
            );
        }

        this.secretsClient = new secretsmanagement.SecretsClient({
          authenticationDetailsProvider,
        });
        (this.secretsClient as { regionId?: string }).regionId = this.config.region;
      } catch (error) {
        this.logger?.error(
          'Failed to initialize Vault client',
          error instanceof Error ? error.stack : String(error),
          'VaultService',
        );
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async getSecret(secretName: string): Promise<string> {
    await this.initializeClient();

    const cached = this.cache[secretName];
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value;
    }

    try {
      if (!this.config.vaultOcid) {
        throw new Error('Vault OCID is not available.');
      }

      if (!this.secretsClient) {
        throw new Error('Secrets client is not initialized.');
      }

      const response = await (this.secretsClient as unknown as {
        getSecretBundleByName(request: {
          secretName: string;
          vaultId: string;
        }): Promise<SecretBundleResponse>;
      }).getSecretBundleByName({
        secretName: secretName,
        vaultId: this.config.vaultOcid,
      });

      const secretBundle = response.secretBundle || (response as unknown as { secretBundleContent?: { content?: string } });
      const secretContent = 'secretBundleContent' in response
        ? (response as unknown as { secretBundleContent?: { content?: string } }).secretBundleContent
        : secretBundle?.secretBundleContent;

      if (!secretContent?.content) {
        throw new Error(`Secret '${secretName}' has no content`);
      }

      const decodedValue = Buffer.from(secretContent.content, 'base64').toString('utf-8');

      this.cache[secretName] = {
        value: decodedValue,
        timestamp: Date.now(),
      };

      return decodedValue;
    } catch (error) {
      this.logger?.error(
        `Failed to get secret '${secretName}'`,
        error instanceof Error ? error.stack : String(error),
        'VaultService',
      );
      throw error;
    }
  }

  async getSecrets(secretNames: string[]): Promise<Record<string, string>> {
    const secrets: Record<string, string> = {};
    const batchSize = 10;

    for (let i = 0; i < secretNames.length; i += batchSize) {
      const batch = secretNames.slice(i, i + batchSize);
      const promises = batch.map(async (name) => {
        try {
          const value = await this.getSecret(name);
          return { name, value };
        } catch (error) {
          this.logger?.error(
            `Failed to get secret '${name}'`,
            error instanceof Error ? error.stack : String(error),
            'VaultService',
          );
          throw error;
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ name, value }) => {
        secrets[name] = value;
      });

      if (i + batchSize < secretNames.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return secrets;
  }

  clearCache(): void {
    this.cache = {};
  }
}

