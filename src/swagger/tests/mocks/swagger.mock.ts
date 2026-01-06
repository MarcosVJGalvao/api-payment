import { SwaggerObject } from '../../interfaces/swagger.interface';

export const mockNumericKeyedObject = (): SwaggerObject => ({
  '0': { a: 1 },
  '1': { a: 2 },
});

export const mockEnumObject = (): SwaggerObject => ({
  enum: { A: 'a', B: 'b' },
});

export const mockSwaggerWithRequestBody = (): SwaggerObject => ({
  paths: {
    '/x': {
      get: {
        requestBody: { foo: 1 },
      },
    },
  },
});

export const mockSwaggerWithSchemaResponse = (): SwaggerObject => ({
  paths: {
    '/test': {
      get: {
        responses: {
          '200': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
});

export const mockSwaggerSecurity = (): SwaggerObject => ({
  security: { bearer: [] },
});

export const mockSwaggerRequired = (): SwaggerObject => ({
  type: 'object',
  required: { field1: true, field2: true },
});
