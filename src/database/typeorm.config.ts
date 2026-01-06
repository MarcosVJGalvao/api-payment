import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './helpers/database-config.helper';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const { host, port, username, password, database } = getDatabaseConfig(configService);
  const sslMode = configService.get<string>('DB_SSL_MODE');

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
      connectionLimit: 10,
      waitForConnections: true,
      idleTimeout: 30000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    },
  };
};
