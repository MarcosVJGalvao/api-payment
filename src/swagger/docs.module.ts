import { Module } from '@nestjs/common';
import { SwaggerService } from './swagger.service';
import { DocsController } from './docs.controller';
import { LoggerModule } from '@/common/logger/logger.module';
import { SwaggerDocumentNormalizerService } from './services/swagger-document-normalizer.service';
import { SwaggerExamplesService } from './services/swagger-examples.service';
import { SwaggerDocumentFilterService } from './services/swagger-document-filter.service';
import { SwaggerSchemaReferenceService } from './services/swagger-schema-reference.service';
import { SwaggerDocumentCacheService } from './services/swagger-document-cache.service';

@Module({
  imports: [LoggerModule],
  controllers: [DocsController],
  providers: [
    SwaggerService,
    SwaggerDocumentNormalizerService,
    SwaggerExamplesService,
    SwaggerDocumentFilterService,
    SwaggerSchemaReferenceService,
    SwaggerDocumentCacheService,
  ],
  exports: [SwaggerService],
})
export class DocsModule {}
