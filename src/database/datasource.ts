import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { createTypeOrmOptions } from './helpers/typeorm-options.helper';

process.env.DOTENVX_QUIET = 'true';
dotenv.config({ debug: false });

const defaultPoolMax = process.env.NODE_ENV === 'production' ? 20 : 5;
const connectionLimit = process.env.DB_POOL_MAX
  ? Number(process.env.DB_POOL_MAX)
  : defaultPoolMax;
const idleTimeout = process.env.DB_IDLE_TIMEOUT
  ? Number(process.env.DB_IDLE_TIMEOUT)
  : 10000;

export default new DataSource(
  createTypeOrmOptions(
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      username: process.env.DB_USERNAME || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || '',
    },
    {
      sslMode: process.env.DB_SSL_MODE,
      migrationsRun: false,
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
      connectionLimit,
      idleTimeout,
      timeZone: process.env.TIME_ZONE,
    },
  ),
);
