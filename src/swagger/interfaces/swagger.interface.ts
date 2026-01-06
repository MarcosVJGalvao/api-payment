/**
 * Interfaces para tipagem do OpenAPI/Swagger
 */

export interface SwaggerSecurityScheme {
  bearer?: string[];
  [key: string]: string[] | undefined;
}

export interface SwaggerResponse {
  schema?: Record<string, unknown>;
  content?: {
    'application/json'?: {
      schema?: Record<string, unknown>;
    };
    [key: string]:
      | {
          schema?: Record<string, unknown>;
        }
      | undefined;
  };
  description?: string;
  [key: string]: unknown;
}

export interface SwaggerPathItem {
  get?: SwaggerOperation;
  post?: SwaggerOperation;
  put?: SwaggerOperation;
  patch?: SwaggerOperation;
  delete?: SwaggerOperation;
  requestBody?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SwaggerOperation {
  requestBody?: Record<string, unknown>;
  responses?: Record<string, SwaggerResponse>;
  security?: SwaggerSecurityScheme[];
  [key: string]: unknown;
}

export interface SwaggerSchema {
  enum?: unknown[] | Record<string, unknown>;
  required?: string[] | Record<string, unknown>;
  type?: string;
  [key: string]: unknown;
}

export type SwaggerValue =
  | string
  | number
  | boolean
  | null
  | SwaggerObject
  | SwaggerValue[]
  | SwaggerSecurityScheme[];

export interface SwaggerObject {
  enum?: unknown[] | Record<string, unknown>;
  required?: string[] | Record<string, unknown>;
  type?: string;
  security?: SwaggerSecurityScheme[] | SwaggerSecurityScheme;
  requestBody?: Record<string, unknown>;
  responses?: Record<string, SwaggerResponse>;
  paths?: Record<string, SwaggerPathItem>;
  [key: string]: SwaggerValue | Record<string, unknown> | unknown[] | undefined;
}
