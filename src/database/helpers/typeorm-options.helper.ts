import type { DataSourceOptions } from 'typeorm';
import { join } from 'node:path';

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface TypeOrmRuntimeConfig {
  sslMode?: string;
  migrationsRun?: boolean;
  synchronize?: boolean;
  connectionLimit?: number;
  idleTimeout?: number;
  timeZone?: string;
}

export function createTypeOrmOptions(
  connection: DatabaseConnectionConfig,
  runtime: TypeOrmRuntimeConfig = {},
): DataSourceOptions {
  const sslMode = runtime.sslMode;

  return {
    type: 'mysql',
    ...connection,
    entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
    migrationsRun: runtime.migrationsRun ?? true,
    synchronize: runtime.synchronize ?? false,
    ...(sslMode === 'REQUIRED' && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    extra: {
      charset: 'utf8mb4_unicode_ci',
      multipleStatements: true,
      timezone: runtime.timeZone,
      dateStrings: ['DATE'],
      connectionLimit: runtime.connectionLimit,
      waitForConnections: true,
      idleTimeout: runtime.idleTimeout,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    },
  };
}
