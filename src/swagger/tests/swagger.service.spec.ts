import { SwaggerService } from '../swagger.service';
import { createSwaggerServiceTestFactory } from './factory/swagger.service.factory';
import {
  mockNumericKeyedObject,
  mockEnumObject,
  mockSwaggerWithRequestBody,
  mockSwaggerWithSchemaResponse,
  mockSwaggerSecurity,
  mockSwaggerRequired,
} from './mocks/swagger.mock';

describe('SwaggerService', () => {
  let service: SwaggerService;

  beforeEach(async () => {
    const factory = await createSwaggerServiceTestFactory();
    service = factory.swaggerService;
  });

  describe('normalizeSwagger', () => {
    it('should convert numeric-keyed objects to arrays', () => {
      const input = mockNumericKeyedObject();
      const out = (
        service as unknown as { normalizeSwagger: (obj: unknown) => unknown }
      ).normalizeSwagger(input);
      expect(Array.isArray(out)).toBe(true);
      expect((out as Array<{ a: number }>)[0].a).toBe(1);
    });

    it('should transform enum objects into arrays', () => {
      const input = mockEnumObject();
      const out = (
        service as unknown as { normalizeSwagger: (obj: unknown) => unknown }
      ).normalizeSwagger({ schema: input });
      const result = out as { schema: { enum: unknown[] } };
      expect(Array.isArray(result.schema.enum)).toBe(true);
      expect(result.schema.enum.length).toBe(2);
    });

    it('should remove requestBody for GET paths', () => {
      const input = mockSwaggerWithRequestBody();
      const out = (
        service as unknown as { normalizeSwagger: (obj: unknown) => unknown }
      ).normalizeSwagger(input);
      const result = out as {
        paths: { '/x': { get?: { requestBody?: unknown } } };
      };
      expect(result.paths['/x'].get?.requestBody).toBeUndefined();
    });

    it('should move schema to content in responses', () => {
      const input = mockSwaggerWithSchemaResponse();
      const out = (
        service as unknown as { normalizeSwagger: (obj: unknown) => unknown }
      ).normalizeSwagger(input);
      const result = out as {
        paths: {
          '/test': {
            get?: {
              responses?: {
                '200'?: { schema?: unknown; content?: unknown };
              };
            };
          };
        };
      };
      expect(
        result.paths['/test'].get?.responses?.['200']?.schema,
      ).toBeUndefined();
      expect(
        result.paths['/test'].get?.responses?.['200']?.content,
      ).toBeDefined();
    });

    it('should normalize security to array', () => {
      const input = mockSwaggerSecurity();
      const out = (
        service as unknown as { normalizeSwagger: (obj: unknown) => unknown }
      ).normalizeSwagger(input);
      const result = out as { security?: unknown };
      expect(Array.isArray(result.security)).toBe(true);
    });

    it('should normalize required to array for object types', () => {
      const input = mockSwaggerRequired();
      const out = (
        service as unknown as { normalizeSwagger: (obj: unknown) => unknown }
      ).normalizeSwagger(input);
      const result = out as { required?: unknown };
      expect(Array.isArray(result.required)).toBe(true);
    });
  });

  describe('getSwaggerDocument', () => {
    it('should throw error if document not generated', async () => {
      const factory = await createSwaggerServiceTestFactory();
      const newService = factory.swaggerService;
      expect(() => newService.getSwaggerDocument()).toThrow(
        'Swagger document not generated',
      );
    });
  });
});
