import * as winston from 'winston';
import TransportStream from 'winston-transport';
import {
  CloudLoggingProvider,
  CloudLogEntry,
} from './providers/cloud-logging.provider';
import { getModuleName } from './helpers/module-context.helper';
import { transformToISO, getCurrentDate } from '@/common/helpers/date.helpers';

const BOOTSTRAP_SKIP_PATTERNS = [
  /bootstrap/i,
  /starting application/i,
  /loading secrets from vault/i,
  /secrets loaded successfully/i,
  /initializing transactional context/i,
  /creating nestjs application/i,
  /nestjs application created/i,
  /redis connecting/i,
  /redis ready/i,
  /redis connected successfully/i,
  /configuring redis/i,
  /initialized:/i,
  /service initialized/i,
  /storage provider initialized/i,
  /using cloudflare r2/i,
  /using .* as default/i,
  /generating swagger document/i,
  /swagger document generated/i,
];

export interface CloudLoggingTransportOptions
  extends TransportStream.TransportStreamOptions {
  cloudLoggingProvider: CloudLoggingProvider;
}

/** Transport genérico do Winston para cloud logging providers */
export class CloudLoggingTransport extends TransportStream {
  private cloudLoggingProvider: CloudLoggingProvider;

  constructor(options: CloudLoggingTransportOptions) {
    super(options);
    this.cloudLoggingProvider = options.cloudLoggingProvider;
  }

  private shouldSkipMessage(
    message: string | undefined,
    context: string | undefined,
  ): boolean {
    if (
      context === 'Bootstrap' ||
      (context && context.toLowerCase().includes('bootstrap'))
    ) {
      return true;
    }

    if (message && typeof message === 'string') {
      return BOOTSTRAP_SKIP_PATTERNS.some((pattern) => pattern.test(message));
    }

    return false;
  }

  private cleanLevel(level: string): string {
    // eslint-disable-next-line no-control-regex
    return level.replace(/\u001b\[[0-9;]*m/g, '').trim();
  }

  private cleanLogEntry(logEntry: Record<string, any>): Partial<CloudLogEntry> {
    const cleaned: Record<string, any> = {};
    const skipKeys = [
      'splat',
      'level',
      'timestamp',
      'message',
      'skipCloud',
      'skipOci',
      'oracle',
      'context',
      'stack',
    ];

    for (const [key, value] of Object.entries(logEntry)) {
      if (typeof key === 'symbol' || skipKeys.includes(key)) continue;
      cleaned[key] = value;
    }

    if (cleaned.module) delete cleaned.context;

    return this.removeStack(cleaned) as Partial<CloudLogEntry>;
  }

  private removeStack(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.removeStack(item));

    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        obj as Record<string, unknown>,
      )) {
        if (key.toLowerCase() === 'stack') continue;
        cleaned[key] = this.removeStack(value);
      }
      return cleaned;
    }

    return obj;
  }

  log(info: winston.LogEntry, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const context = info.context as string | undefined;
    const shouldSkipCloud =
      (info.skipCloud as boolean) || (info.skipOci as boolean);
    const message = info.message as string | undefined;

    if (shouldSkipCloud === true || this.shouldSkipMessage(message, context)) {
      callback();
      return;
    }

    const moduleName = getModuleName(
      context,
      info as Record<string, any>,
      info.stack as string,
    );

    const cleanedEntry = this.cleanLogEntry(info as Record<string, any>);
    const logEntry: CloudLogEntry = {
      ...cleanedEntry,
      timestamp: (info.timestamp as string) || transformToISO(getCurrentDate()),
      level: this.cleanLevel(info.level || 'info'),
      message: message || '',
    };

    if (logEntry.level && typeof logEntry.level === 'object') {
      delete (logEntry as any).level;
      logEntry.level = 'info';
    }

    this.cloudLoggingProvider.sendLog(moduleName, logEntry).catch((error) => {
      process.stderr.write(
        `[${this.cloudLoggingProvider.getProviderName()}] Failed to send log: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    });

    callback();
  }
}
