/**
 * Configuração e interfaces para integração com Oracle Cloud Vault
 */

export interface VaultConfig {
  vaultOcid: string;
  region: string;
  configFile?: string;
  profile?: string;
  compartmentOcid?: string; // Será preenchido automaticamente a partir do vaultOcid
}

export interface SecretCache {
  [key: string]: {
    value: string;
    timestamp: number;
  };
}

