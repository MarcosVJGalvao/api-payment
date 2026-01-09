import { Injectable } from '@nestjs/common';
import * as common from 'oci-common';
import * as loggingingestion from 'oci-loggingingestion';
import * as path from 'path';
import * as os from 'os';
import { CloudLoggingProvider, CloudLogEntry } from '../cloud-logging.provider';
import type { OCILoggingConfig, ModuleLogMapping } from './oci-logging.config';
import { AppLoggerService } from '../../logger.service';

/** Implementação do CloudLoggingProvider para OCI Logging */
@Injectable()
export class OCILoggingProvider implements CloudLoggingProvider {
  private loggingClient: loggingingestion.LoggingClient | null = null;
  private initializationPromise: Promise<void> | null = null;
  private moduleLogCache: ModuleLogMapping = {};
  private readonly config: OCILoggingConfig;
  private initializationError: Error | null = null;
  private enabled = true;

  constructor(
    config: OCILoggingConfig,
    private readonly logger?: AppLoggerService,
  ) {
    this.config = config;
  }

  getProviderName(): string {
    return 'OCI Logging';
  }

  isEnabled(): boolean {
    return this.enabled && !this.initializationError;
  }

  private async initializeClient(): Promise<void> {
    if (this.initializationError) throw this.initializationError;
    if (this.loggingClient) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        let authenticationDetailsProvider: common.AuthenticationDetailsProvider;

        try {
          const builder = new (
            common as any
          ).InstancePrincipalsAuthenticationDetailsProviderBuilder();
          authenticationDetailsProvider = await builder.build();
        } catch {
          let configFile = this.config.configFile || '~/.oci/config';
          const profile = this.config.profile || 'DEFAULT';

          if (configFile.startsWith('~')) {
            const homeDir = os.homedir();
            configFile = path.join(homeDir, configFile.slice(1));
          }

          const fs = require('fs');
          if (!fs.existsSync(configFile)) {
            throw new Error(`OCI config file not found: ${configFile}`);
          }

          authenticationDetailsProvider =
            new common.ConfigFileAuthenticationDetailsProvider(
              configFile,
              profile,
            );
        }

        this.loggingClient = new loggingingestion.LoggingClient({
          authenticationDetailsProvider,
        });
        (this.loggingClient as { regionId?: string }).regionId =
          this.config.region;
      } catch (error) {
        this.initializationError =
          error instanceof Error ? error : new Error(String(error));
        this.enabled = false;
        this.logger?.error(
          'Failed to initialize OCI Logging client',
          error instanceof Error ? error.stack : String(error),
          'OCILoggingProvider',
        );
      }
    })();

    return this.initializationPromise;
  }

  private async getLogOcidForModule(moduleName: string): Promise<string> {
    if (this.moduleLogCache[moduleName]) return this.moduleLogCache[moduleName];

    if (this.config.logId) {
      this.moduleLogCache[moduleName] = this.config.logId;
      return this.config.logId;
    }

    throw new Error('OCI_LOGGING_LOG_ID is required');
  }

  private removeOracleFields(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj))
      return obj.map((item) => this.removeOracleFields(item));
    if (typeof obj !== 'object') return obj;

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('oracle') ||
        lowerKey === 'compartmentid' ||
        lowerKey === 'loggroupid' ||
        lowerKey === 'logid' ||
        lowerKey === 'tenantid' ||
        lowerKey === 'ingestedtime' ||
        (lowerKey === 'context' && (obj as Record<string, any>).module)
      ) {
        continue;
      }
      cleaned[key] = this.removeOracleFields(value);
    }

    return cleaned;
  }

  private normalizeDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.normalizeDates(item));
    if (obj instanceof Date) return obj.toISOString();

    if (typeof obj === 'object') {
      const normalized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value instanceof Date) {
          normalized[key] = value.toISOString();
        } else if (
          key.toLowerCase() === 'datetime' &&
          typeof value === 'number'
        ) {
          normalized[key] = new Date(value).toISOString();
        } else if (
          key.toLowerCase() === 'timestamp' &&
          typeof value === 'number'
        ) {
          normalized[key] = new Date(value).toISOString();
        } else {
          normalized[key] = this.normalizeDates(value);
        }
      }
      return normalized;
    }

    return obj;
  }

  async sendLog(moduleName: string, logEntry: CloudLogEntry): Promise<void> {
    try {
      await this.initializeClient();

      if (this.initializationError || !this.loggingClient) return;

      const logOcid = await this.getLogOcidForModule(moduleName);
      const logTimestamp = logEntry.timestamp || new Date().toISOString();

      if (logEntry.level && typeof logEntry.level === 'string') {
        logEntry.level = logEntry.level.replace(/\u001b\[[0-9;]*m/g, '').trim();
      }

      const cleanedEntry = this.removeOracleFields(logEntry);
      const normalizedEntry = this.normalizeDates(cleanedEntry);

      const isoTimestamp =
        typeof logTimestamp === 'string'
          ? logTimestamp.includes('T')
            ? logTimestamp
            : new Date(logTimestamp).toISOString()
          : new Date(logTimestamp).toISOString();

      const logData = {
        ...normalizedEntry,
        module: moduleName,
        timestamp: isoTimestamp,
      };

      const logEntryData: loggingingestion.models.LogEntry = {
        data: JSON.stringify(logData),
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        time: new Date(isoTimestamp),
      };

      const putLogsRequest: loggingingestion.requests.PutLogsRequest = {
        logId: logOcid,
        putLogsDetails: {
          specversion: '1.0',
          logEntryBatches: [
            {
              entries: [logEntryData],
              source: 'school-api',
              type: `module:${moduleName}`,
              defaultlogentrytime: new Date(),
            },
          ],
        },
      };

      await this.loggingClient.putLogs(putLogsRequest);
    } catch (error) {
      this.logger?.error(
        `Failed to send log to OCI for module ${moduleName}`,
        error instanceof Error ? error.stack : String(error),
        'OCILoggingProvider',
      );
    }
  }

  clearCache(): void {
    this.moduleLogCache = {};
  }
}
