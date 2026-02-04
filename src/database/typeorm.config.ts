import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './helpers/database-config.helper';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const { host, port, username, password, database } =
    getDatabaseConfig(configService);
  const sslMode = configService.get<string>('DB_SSL_MODE');

  const defaultPoolMax = process.env.NODE_ENV === 'production' ? 20 : 5;
  const connectionLimit = configService.get<number>(
    'DB_POOL_MAX',
    defaultPoolMax,
  );
  const idleTimeout = configService.get<number>('DB_IDLE_TIMEOUT', 10000);

  return {
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    autoLoadEntities: true,
    migrations: [__dirname + '/migrations/*.ts'],
    migrationsRun: true,
    synchronize: configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true',
    ...(sslMode === 'REQUIRED' && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    extra: {
      charset: 'utf8mb4_unicode_ci',
      multipleStatements: true,
      timezone: configService.get<string>('TIME_ZONE'),
      dateStrings: ['DATE'],
      connectionLimit,
      waitForConnections: true,
      idleTimeout,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    },
  };
};
