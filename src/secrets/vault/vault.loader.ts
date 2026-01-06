import * as dotenv from 'dotenv';
import * as common from 'oci-common';
import * as secretsmanagement from 'oci-secrets';
import * as keymanagement from 'oci-keymanagement';
import * as path from 'path';
import * as os from 'os';
import { VaultConfig } from './vault.config';
import { SECRETS_MAPPING } from './secrets.mapping';

interface SecretBundleResponse {
  secretBundle?: {
    secretBundleContent?: {
      content?: string;
      contentType?: string;
    };
  };
}


export async function loadSecretsFromVault(): Promise<void> {
  // Carregar .env primeiro, mas não sobrescrever valores já existentes
  // Isso permite que valores do Vault tenham prioridade
  process.env.DOTENVX_QUIET = 'true';
  dotenv.config({ override: false, debug: false });

  const secretsSource = process.env.SECRETS_SOURCE?.toUpperCase();
  
  if (secretsSource !== 'VAULT') {
    return;
  }

  try {
    // Use OCI_REGION with fallback to VAULT_REGION for compatibility
    const region =
      process.env.OCI_REGION || process.env.VAULT_REGION || '';

    const vaultConfig: VaultConfig = {
      vaultOcid: process.env.VAULT_OCID || '',
      region: region,
      configFile: process.env.OCI_CONFIG_FILE,
      profile: process.env.OCI_PROFILE,
    };

    if (!vaultConfig.vaultOcid) {
      throw new Error('VAULT_OCID is required when SECRETS_SOURCE=VAULT');
    }

    vaultConfig.vaultOcid = (process.env.VAULT_OCID || '').trim().replace(/[\s\r\n\t\u00A0\u2000-\u200B\u2028\u2029\uFEFF]/g, '');
    
    if (!vaultConfig.vaultOcid) {
      throw new Error('VAULT_OCID is required when SECRETS_SOURCE=VAULT');
    }
    
    if (!vaultConfig.vaultOcid.startsWith('ocid1.vault.')) {
      throw new Error('Invalid VAULT_OCID format');
    }

    if (!vaultConfig.region) {
      throw new Error(
        'OCI_REGION (or VAULT_REGION for compatibility) is required when SECRETS_SOURCE=VAULT',
      );
    }

    let authenticationDetailsProvider: common.AuthenticationDetailsProvider;
    let usingInstancePrincipal = false;

    try {
      const builder = new (common as any).InstancePrincipalsAuthenticationDetailsProviderBuilder();
      authenticationDetailsProvider = await builder.build();
      usingInstancePrincipal = true;
    } catch (error) {
      const instancePrincipalError = error instanceof Error ? error.message : String(error);
      
      let configFile = vaultConfig.configFile || '~/.oci/config';
      const profile = vaultConfig.profile || 'DEFAULT';
      
      if (configFile.startsWith('~')) {
        const homeDir = os.homedir();
        configFile = path.join(homeDir, configFile.slice(1));
      }
      
      const fs = require('fs');
      if (!fs.existsSync(configFile)) {
        throw new Error(`Config file not found: ${configFile}`);
      }
      
      authenticationDetailsProvider =
        new common.ConfigFileAuthenticationDetailsProvider(configFile, profile);
    }

    let compartmentOcid = process.env.VAULT_COMPARTMENT_OCID;
    
    if (!compartmentOcid && usingInstancePrincipal) {
      try {
        const kmsVaultClient = new keymanagement.KmsVaultClient({
          authenticationDetailsProvider,
        });
        (kmsVaultClient as { regionId?: string }).regionId = vaultConfig.region;

        const vaultDetails = await (kmsVaultClient as unknown as {
          getVault(request: { vaultId: string }): Promise<{ vault?: { compartmentId?: string } }>;
        }).getVault({
          vaultId: vaultConfig.vaultOcid,
        });
        
        compartmentOcid = vaultDetails.vault?.compartmentId;
      } catch (error) {
        compartmentOcid = undefined;
      }
    }

    vaultConfig.compartmentOcid = compartmentOcid;

    const secretsClient = new secretsmanagement.SecretsClient({
      authenticationDetailsProvider,
    });
    (secretsClient as { regionId?: string }).regionId = vaultConfig.region;

    const secretNames = SECRETS_MAPPING as readonly string[];
    const secrets: Record<string, string> = {};

    const batchSize = 10;
    for (let i = 0; i < secretNames.length; i += batchSize) {
      const batch = secretNames.slice(i, i + batchSize);
      const promises = batch.map(async (secretName) => {
        try {
          const vaultIdToUse = vaultConfig.vaultOcid.trim();
          
          const response = await secretsClient.getSecretBundleByName({
            secretName: secretName,
            vaultId: vaultIdToUse,
          });
          
          if (!response) {
            throw new Error(`Secret '${secretName}' returned empty response`);
          }

          const secretBundle = response.secretBundle || (response as unknown as { secretBundleContent?: { content?: string } });
          const secretContent = 'secretBundleContent' in response 
            ? (response as unknown as { secretBundleContent?: { content?: string } }).secretBundleContent
            : secretBundle?.secretBundleContent;
          
          if (!secretContent?.content) {
            throw new Error(`Secret '${secretName}' has no content`);
          }

          const decodedValue = Buffer.from(secretContent.content, 'base64').toString('utf-8');
          return { name: secretName, value: decodedValue };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to get secret '${secretName}': ${errorMessage}`);
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

    for (const [name, value] of Object.entries(secrets)) {
      process.env[name] = value;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Remover informações sensíveis do erro
    const sanitizedError = errorMessage
      .replace(/ocid[^\s]+/gi, '[OCID]')
      .replace(/[a-zA-Z0-9+/]{40,}/g, '[REDACTED]')
      .replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
      .replace(/key[=:]\s*[^\s]+/gi, 'key=[REDACTED]');

    throw new Error(`VaultLoader failed: ${sanitizedError}`);
  }
}

