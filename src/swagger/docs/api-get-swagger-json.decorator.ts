import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';

export function ApiGetSwaggerJson() {
  return applyDecorators(
    ApiOperation({
      summary: 'Exportar documentação Swagger em formato JSON',
      description:
        'Retorna a documentação da API em formato OpenAPI 3.0 (JSON) compatível com Postman, APIDog e outras ferramentas de API testing.',
    }),
    ApiProduces('application/json'),
    ApiResponse({
      status: 200,
      description: 'Documentação Swagger em formato JSON (OpenAPI 3.0)',
      schema: {
        type: 'object',
        example: {
          openapi: '3.0.0',
          info: {
            title: 'School System API',
            version: '1.0',
          },
          paths: {},
          components: {},
        },
      },
    }),
  );
}
