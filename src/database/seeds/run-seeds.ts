import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { runSeeds } from './index';

// Load environment variables
process.env.DOTENVX_QUIET = 'true';
dotenv.config({ debug: false });

async function bootstrap() {
  const sslMode = process.env.DB_SSL_MODE;

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
    ...(sslMode === 'REQUIRED' && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    extra: {
      charset: 'utf8mb4_unicode_ci',
      multipleStatements: true,
      timezone: process.env.TIME_ZONE || 'Z',
    },
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established\n');

    await runSeeds(dataSource);

    await dataSource.destroy();
    console.log('\n📦 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

bootstrap();
