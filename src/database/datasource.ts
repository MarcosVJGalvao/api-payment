import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

process.env.DOTENVX_QUIET = 'true';
dotenv.config({ debug: false });

const sslMode = process.env.DB_SSL_MODE;

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  // SSL configuration for Aiven and other cloud providers
  ...(sslMode === 'REQUIRED' && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    idleTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  },
});
