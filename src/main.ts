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
import {
  apiReference,
  type NestJSReferenceConfiguration,
} from '@scalar/nestjs-api-reference';
import { buildDocsPortalHtml } from './swagger/templates/docs-portal.template';
import { getManualTags } from './swagger/helpers/manual-tags.registry';
import { HttpExceptionFilter } from './common/errors/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConditionalClassSerializerInterceptor } from './common/interceptors/conditional-class-serializer.interceptor';
import { AppLoggerService } from './common/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { SwaggerService } from './swagger/swagger.service';
import { createStandaloneLogger } from './common/logger/standalone-logger';
import { RequestLoggingInterceptor } from './common/logger/interceptors/request-logging.interceptor';
import { loadSecretsFromVault } from './secrets/vault/vault.loader';
import {
  getErrorMessage,
  getErrorTrace,
} from './common/helpers/exception.helper';
import { ResponseSanitizationInterceptor } from './common/interceptors/response-sanitization.interceptor';

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
      new ResponseSanitizationInterceptor([
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

    // ── Scalar API Reference ──────────────────────────────────────────
    const scalarBaseConfig: NestJSReferenceConfiguration = {
      theme: 'deepSpace',
      layout: 'modern',
      forceDarkModeState: 'dark',
      hideDarkModeToggle: true,
      persistAuth: true,
      hideModels: false,
      defaultOpenAllTags: false,
      searchHotKey: 'k',
      showSidebar: true,
      withDefaultFonts: true,
      showDeveloperTools: 'localhost',
      defaultHttpClient: {
        targetKey: 'node',
        clientKey: 'axios',
      },
    };

    const expressApp = app.getHttpAdapter().getInstance();

    // ── Portal de Documentação (navbar Manual/API) ────────────────────
    const portalHtml = buildDocsPortalHtml(
      {
        title: 'Payments API',
        apiSpecUrl: '/api/openapi.json',
        scalarUrl: '/docs/api',
      },
      getManualTags(),
    );

    expressApp.get(
      '/docs',
      (
        _req: unknown,
        res: { type: (t: string) => { send: (h: string) => void } },
      ) => {
        res.type('html').send(portalHtml);
      },
    );

    // ── Scalar API Reference ──────────────────────────────────────────
    expressApp.use(
      '/docs/api',
      apiReference({
        ...scalarBaseConfig,
        pageTitle: 'Payments API - API Reference',
        url: '/api/openapi.json',
      }),
    );

    expressApp.use(
      '/docs/api/provider',
      apiReference({
        ...scalarBaseConfig,
        pageTitle: 'Payments API - Provider',
        url: '/api/provider/openapi.json',
      }),
    );

    expressApp.use(
      '/docs/api/backoffice',
      apiReference({
        ...scalarBaseConfig,
        pageTitle: 'Payments API - Backoffice',
        url: '/api/backoffice/openapi.json',
      }),
    );

    expressApp.use(
      '/docs/api/internal',
      apiReference({
        ...scalarBaseConfig,
        pageTitle: 'Payments API - Internal',
        url: '/api/internal/openapi.json',
      }),
    );

    const port = configService.get<number>('PORT', 3000);
    await app.listen(port);

    app.useLogger(logger);

    console.log('\n\u2705  Application Successfully Started\n');
    console.log(`\ud83d\udccd  Server:     http://localhost:${port}`);
    console.log(`\ud83d\udcda  Docs Portal: http://localhost:${port}/docs`);
    console.log(`\u26a1  Scalar API Reference:`);
    console.log(`    - Completo:    http://localhost:${port}/docs/api`);
    console.log(
      `    - Provider:    http://localhost:${port}/docs/api/provider`,
    );
    console.log(
      `    - Backoffice:  http://localhost:${port}/docs/api/backoffice`,
    );
    console.log(
      `    - Internal:    http://localhost:${port}/docs/api/internal`,
    );
    console.log(`\ud83d\udcda  Swagger UI (legacy):`);
    console.log(`    - Completo:    http://localhost:${port}/api`);
    console.log(`    - Provider:    http://localhost:${port}/api/provider`);
    console.log(`    - Backoffice:  http://localhost:${port}/api/backoffice`);
    console.log(`    - Internal:    http://localhost:${port}/api/internal`);
    console.log(`\ud83d\udcca  Queues:     http://localhost:${port}/queues`);
    console.log(
      '\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n',
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
