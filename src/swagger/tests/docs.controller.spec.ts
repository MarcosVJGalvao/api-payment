import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { DocsController } from '../docs.controller';
import { SwaggerService } from '../swagger.service';
import { OpenAPIObject } from '@nestjs/swagger';

describe('DocsController', () => {
  let controller: DocsController;
  let swaggerService: SwaggerService;

  const mockSwaggerDocument: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'School System API',
      version: '1.0',
      description: 'API Documentation for School System',
    },
    paths: {},
    components: {},
  };

  const mockSwaggerService = {
    getSwaggerDocument: jest.fn().mockReturnValue(mockSwaggerDocument),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocsController],
      providers: [
        {
          provide: SwaggerService,
          useValue: mockSwaggerService,
        },
      ],
    }).compile();

    controller = module.get<DocsController>(DocsController);
    swaggerService = module.get<SwaggerService>(SwaggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSwaggerJson', () => {
    it('should return Swagger document as JSON', () => {
      const mockResponse = {
        setHeader: jest.fn(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      controller.getSwaggerJson(mockResponse);

      expect(swaggerService.getSwaggerDocument).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockSwaggerDocument);
    });
  });

  describe('getOpenApiJson', () => {
    it('should call getSwaggerJson', () => {
      const mockResponse = {
        setHeader: jest.fn(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      controller.getOpenApiJson(mockResponse);

      expect(swaggerService.getSwaggerDocument).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockSwaggerDocument);
    });
  });
});
