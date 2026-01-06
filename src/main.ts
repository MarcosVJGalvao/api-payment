process.env.DOTENVX_QUIET = 'true';

const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  const message = args.join(' ');
  if (message.includes('[dotenv@') || message.includes('injecting env')) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/errors/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { RemoveSensitiveFieldsInterceptor } from './common/interceptors/remove-sensitive-fields.interceptor';
import { RemoveNestedTimestampsInterceptor } from './common/interceptors/remove-nested-timestamps.interceptor';
import { ConditionalClassSerializerInterceptor } from './common/interceptors/conditional-class-serializer.interceptor';
import { AppLoggerService } from './common/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { SwaggerService } from './swagger/swagger.service';
import { createStandaloneLogger } from './common/logger/standalone-logger';
import { RequestLoggingInterceptor } from './common/logger/interceptors/request-logging.interceptor';
import { loadSecretsFromVault } from './secrets/vault/vault.loader';

async function bootstrap() {
  const standaloneLogger = createStandaloneLogger();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀  SCHOOL API - Starting Application                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    await loadSecretsFromVault();
  } catch (error) {
    standaloneLogger.error(
      `Failed to load secrets from Vault: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
    if (process.env.SECRETS_SOURCE?.toUpperCase() === 'VAULT') {
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
    bufferLogs: true,
  });

  const logger = app.get(AppLoggerService);
  const configService = app.get(ConfigService);

  app.useLogger(logger);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(logger));

  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(logger),
    new ConditionalClassSerializerInterceptor(app.get(Reflector)),
    new RemoveNestedTimestampsInterceptor(),
    new RemoveSensitiveFieldsInterceptor([
      'password',
      'secret',
      'secretEncrypted',
      'token',
      'apiKey',
      'api_key',
    ]),
  );

  const swaggerService = app.get(SwaggerService);
  swaggerService.generateDocument(app);

  SwaggerModule.setup('api', app, swaggerService.getSwaggerDocument(), {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log('\n✅  Application Successfully Started\n');
  console.log(`📍  Server:     http://localhost:${port}`);
  console.log(`📚  Swagger UI: http://localhost:${port}/api`);
  console.log(`📄  OpenAPI:    http://localhost:${port}/api/openapi.json`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

void bootstrap().catch((error) => {
  const logger = createStandaloneLogger();
  logger.error(
    `Error starting application: ${error.message}`,
    error instanceof Error ? error.stack : undefined,
  );
  process.exit(1);
});
