import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { AppLoggerService } from '@/common/logger/logger.service';
import { SwaggerDocumentNormalizerService } from './services/swagger-document-normalizer.service';
import { SwaggerExamplesService } from './services/swagger-examples.service';
import { SwaggerDocumentFilterService } from './services/swagger-document-filter.service';
import { SwaggerDocumentCacheService } from './services/swagger-document-cache.service';
import { PORTAL_SCALAR_HIDDEN_TAGS } from './config/docs-visibility.config';

@Injectable()
export class SwaggerService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly normalizer: SwaggerDocumentNormalizerService,
    private readonly examples: SwaggerExamplesService,
    private readonly filterService: SwaggerDocumentFilterService,
    private readonly cache: SwaggerDocumentCacheService,
  ) {}

  generateDocument(app: INestApplication): void {
    try {
      const config = new DocumentBuilder()
        .setTitle('Payments API')
        .setDescription(
          'API de pagamentos que integra múltiplos provedores financeiros para processamento de transações PIX, Boletos, TED e Pagamentos de Contas.',
        )
        .setVersion('1.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT para usuários do Backoffice',
          },
          'backoffice-auth',
        )
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT para usuários Internos',
          },
          'internal-auth',
        )
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT para Provedores Financeiros',
          },
          'provider-auth',
        )
        .build();

      const rawDocument = SwaggerModule.createDocument(app, config);
      const normalized = this.normalizer.normalizeSwagger(rawDocument);
      if (!this.normalizer.isOpenApiObject(normalized)) {
        throw new Error('Normalized swagger document is invalid');
      }

      this.examples.enrichSuccessResponseExamples(normalized);
      this.cache.setBaseDocument(normalized);
    } catch (error) {
      this.logger.error(
        'Failed to generate Swagger document',
        error instanceof Error ? error.stack : String(error),
        'SwaggerService',
      );
      throw error;
    }
  }

  getSwaggerDocument(): OpenAPIObject {
    const document = this.cache.getBaseDocument();
    if (!document) {
      throw new Error(
        'Swagger document not generated. Call generateDocument() first.',
      );
    }
    return document;
  }

  getFilteredDocument(authKey: string): OpenAPIObject {
    const base = this.getSwaggerDocument();
    const cached = this.cache.getFilteredDocument(authKey);
    if (cached) return cached;

    const filtered = this.filterService.getFilteredDocument(base, authKey);
    this.cache.setFilteredDocument(authKey, filtered);
    return filtered;
  }

  getPortalScalarDocument(authKey?: string): OpenAPIObject {
    const cacheKey = authKey
      ? `portal-scalar:${authKey}:${PORTAL_SCALAR_HIDDEN_TAGS.join(',')}`
      : `portal-scalar:full:${PORTAL_SCALAR_HIDDEN_TAGS.join(',')}`;

    const cached = this.cache.getTaggedFilteredDocument(cacheKey);
    if (cached) return cached;

    const base = authKey
      ? this.getFilteredDocument(authKey)
      : this.getSwaggerDocument();
    const filtered = this.filterService.getDocumentWithoutTags(
      base,
      PORTAL_SCALAR_HIDDEN_TAGS,
      authKey,
    );
    this.cache.setTaggedFilteredDocument(cacheKey, filtered);
    return filtered;
  }

  // Test compatibility for existing unit tests that access private normalizeSwagger.
  private normalizeSwagger(obj: unknown): unknown {
    return this.normalizer.normalizeSwagger(obj);
  }
}
