import * as winston from 'winston';
import TransportStream from 'winston-transport';
import {
  CloudLoggingProvider,
  CloudLogEntry,
} from './providers/cloud-logging.provider';
import { getModuleName } from './helpers/module-context.helper';
import { transformToISO, getCurrentDate } from '@/common/helpers/date.helpers';
import { isRecord } from '@/common/errors/helpers/type.helpers';
import { getErrorMessage } from '@/common/helpers/exception.helper';

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

  private cleanLogEntry(
    logEntry: Record<string, unknown>,
  ): Partial<CloudLogEntry> {
    const cleaned: Record<string, unknown> = {};
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

    const cleanedWithoutStack = this.removeStack(cleaned);
    return isRecord(cleanedWithoutStack) ? cleanedWithoutStack : {};
  }

  private removeStack(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.removeStack(item));

    if (isRecord(obj)) {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.toLowerCase() === 'stack') continue;
        cleaned[key] = this.removeStack(value);
      }
      return cleaned;
    }

    return obj;
  }

  log(info: winston.LogEntry, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const infoRecord = isRecord(info) ? info : {};
    const context =
      typeof infoRecord['context'] === 'string'
        ? infoRecord['context']
        : undefined;
    const shouldSkipCloud =
      Boolean(infoRecord['skipCloud']) || Boolean(infoRecord['skipOci']);
    const message =
      typeof infoRecord['message'] === 'string'
        ? infoRecord['message']
        : undefined;

    if (shouldSkipCloud === true || this.shouldSkipMessage(message, context)) {
      callback();
      return;
    }

    const stack =
      typeof infoRecord['stack'] === 'string' ? infoRecord['stack'] : undefined;
    const moduleName = getModuleName(context, infoRecord, stack);

    const cleanedEntry = this.cleanLogEntry(infoRecord);
    const timestamp =
      typeof infoRecord['timestamp'] === 'string'
        ? infoRecord['timestamp']
        : undefined;
    const level = typeof info.level === 'string' ? info.level : 'info';
    const logEntry: CloudLogEntry = {
      ...cleanedEntry,
      timestamp: timestamp || transformToISO(getCurrentDate()),
      level: this.cleanLevel(level),
      message: message || '',
    };

    if (typeof logEntry.level !== 'string') {
      logEntry.level = 'info';
    }

    this.cloudLoggingProvider.sendLog(moduleName, logEntry).catch((error) => {
      process.stderr.write(
        `[${this.cloudLoggingProvider.getProviderName()}] Failed to send log: ${getErrorMessage(error)}\n`,
      );
    });

    callback();
  }
}
