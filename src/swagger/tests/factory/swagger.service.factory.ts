import { Test } from '@nestjs/testing';
import { SwaggerService } from '../../swagger.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import { SwaggerDocumentNormalizerService } from '../../services/swagger-document-normalizer.service';
import { SwaggerExamplesService } from '../../services/swagger-examples.service';
import { SwaggerDocumentFilterService } from '../../services/swagger-document-filter.service';
import { SwaggerSchemaReferenceService } from '../../services/swagger-schema-reference.service';
import { SwaggerDocumentCacheService } from '../../services/swagger-document-cache.service';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  logWithContext: jest.fn(),
};

export const createSwaggerServiceTestFactory = async () => {
  const module = await Test.createTestingModule({
    providers: [
      SwaggerService,
      SwaggerDocumentNormalizerService,
      SwaggerExamplesService,
      SwaggerDocumentFilterService,
      SwaggerSchemaReferenceService,
      SwaggerDocumentCacheService,
      {
        provide: AppLoggerService,
        useValue: mockLogger,
      },
    ],
  }).compile();

  return {
    swaggerService: module.get<SwaggerService>(SwaggerService),
    loggerMock: mockLogger,
  };
};
