import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './helpers/database-config.helper';
import { createTypeOrmOptions } from './helpers/typeorm-options.helper';

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

  const baseOptions = createTypeOrmOptions(
    { host, port, username, password, database },
    {
      sslMode,
      migrationsRun: true,
      synchronize: configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true',
      connectionLimit,
      idleTimeout,
      timeZone: configService.get<string>('TIME_ZONE'),
    },
  );

  return {
    ...baseOptions,
    // Required so entities registered via `TypeOrmModule.forFeature(...)` are
    // automatically added to the default DataSource.
    autoLoadEntities: true,
  };
};
