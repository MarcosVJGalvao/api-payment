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
import { getErrorMessage, getErrorTrace } from './common/helpers/exception.helper';

async function bootstrap() {
  const standaloneLogger = createStandaloneLogger();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀  PAYMENTS API - Starting Application                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    await loadSecretsFromVault();
  } catch (error) {
    standaloneLogger.error(
      `Failed to load secrets from Vault: ${getErrorMessage(error)}`,
      getErrorTrace(error),
    );
    if (process.env.SECRETS_SOURCE?.toUpperCase() === 'VAULT') {
      process.exit(1);
    }
  }

  try {
    console.log('🏗️  Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
      bufferLogs: true,
    });

    const logger = app.get(AppLoggerService);
    const configService = app.get(ConfigService);

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
        'secretAnswer',
      ]),
    );

    const swaggerService = app.get(SwaggerService);
    swaggerService.generateDocument(app);

    const swaggerOptions = {
      persistAuthorization: true,
    };

    SwaggerModule.setup('api', app, swaggerService.getSwaggerDocument(), {
      jsonDocumentUrl: '/api/openapi.json',
      swaggerOptions,
    });

    SwaggerModule.setup(
      'api/provider',
      app,
      swaggerService.getFilteredDocument('provider-auth'),
      {
        jsonDocumentUrl: '/api/provider/openapi.json',
        swaggerOptions,
      },
    );

    SwaggerModule.setup(
      'api/backoffice',
      app,
      swaggerService.getFilteredDocument('backoffice-auth'),
      {
        jsonDocumentUrl: '/api/backoffice/openapi.json',
        swaggerOptions,
      },
    );

    SwaggerModule.setup(
      'api/internal',
      app,
      swaggerService.getFilteredDocument('internal-auth'),
      {
        jsonDocumentUrl: '/api/internal/openapi.json',
        swaggerOptions,
      },
    );

    const port = configService.get<number>('PORT', 3000);
    await app.listen(port);

    app.useLogger(logger);

    console.log('\n✅  Application Successfully Started\n');
    console.log(`📍  Server:     http://localhost:${port}`);
    console.log(`📚  Swagger UI:`);
    console.log(`    - Completo:    http://localhost:${port}/api`);
    console.log(`    - Provider:    http://localhost:${port}/api/provider`);
    console.log(`    - Backoffice:  http://localhost:${port}/api/backoffice`);
    console.log(`    - Internal:    http://localhost:${port}/api/internal`);
    console.log(`📄  OpenAPI JSON:`);
    console.log(`    - Completo:    http://localhost:${port}/api/openapi.json`);
    console.log(
      `    - Provider:    http://localhost:${port}/api/provider/openapi.json`,
    );
    console.log(
      `    - Backoffice:  http://localhost:${port}/api/backoffice/openapi.json`,
    );
    console.log(
      `    - Internal:    http://localhost:${port}/api/internal/openapi.json`,
    );
    console.log(`📊  Queues:     http://localhost:${port}/queues`);
    console.log(
      '\n═══════════════════════════════════════════════════════════\n',
    );
  } catch (error) {
    standaloneLogger.error(
      `Failed to start application: ${getErrorMessage(error)}`,
      getErrorTrace(error),
    );
    throw error;
  }
}

void bootstrap().catch((error) => {
  const logger = createStandaloneLogger();
  logger.error(
    `Error starting application: ${error.message}`,
    error instanceof Error ? error.stack : undefined,
  );
  process.exit(1);
});
