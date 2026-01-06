import { Test } from '@nestjs/testing';
import { SwaggerService } from '../../swagger.service';
import { AppLoggerService } from '@/common/logger/logger.service';

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
