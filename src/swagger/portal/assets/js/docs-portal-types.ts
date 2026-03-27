export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ManualTag {
  name: string;
  description: string;
  apiTag?: string;
  order?: number;
}

export interface SecurityRequirement {
  [schemeName: string]: unknown;
}

export interface OpenApiParameter {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
}

export interface OpenApiResponse {
  description?: string;
  content?: Record<string, OpenApiMediaType>;
  schema?: OpenApiSchema;
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
  example?: unknown;
  examples?: Record<string, { value?: unknown }>;
}

export interface OpenApiSchema {
  $ref?: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  required?: string[];
  description?: string;
  example?: unknown;
}

export interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  security?: SecurityRequirement[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    content?: Record<string, OpenApiMediaType>;
  };
  responses?: Record<string, OpenApiResponse>;
  [key: string]: unknown;
}

export interface OpenApiSpec {
  paths?: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
    securitySchemes?: Record<string, SecurityScheme>;
  };
  [key: string]: unknown;
}

export interface EndpointDoc extends OpenApiOperation {
  method: HttpMethod;
  path: string;
}

export type EndpointsByTag = Record<string, EndpointDoc[]>;

export interface SecurityScheme {
  type?: string;
  scheme?: string;
  in?: string;
  name?: string;
  description?: string;
}

export interface HeaderRequirement {
  name: string;
  source: 'auth' | 'parameter';
  required: boolean;
  description?: string;
}

export interface AuthGroupMeta {
  label: string;
  order: number;
}

export type AuthKey =
  | 'backoffice-auth'
  | 'internal-auth'
  | 'provider-auth'
  | 'public'
  | string;

export interface EndpointSelection {
  tag: string;
  index: number;
}

export interface ManualSelection {
  type: 'manual';
  slug: string;
  index?: number;
  tag?: string;
}

export interface EndpointManualSelection {
  type: 'endpoint';
  tag: string;
  index: number;
}

export type CurrentManualSelection = ManualSelection | EndpointManualSelection | null;

export interface ApiPortalRouteEndpoint {
  type: 'endpoint';
  tagSlug: string;
  index: number;
}

export interface ApiPortalRoutePortal {
  type: 'portal';
}

export type ApiPortalRoute = ApiPortalRouteEndpoint | ApiPortalRoutePortal;

