import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database Configuration
  // DB_HOST, DB_USERNAME, DB_PASSWORD são obrigatórios apenas quando SECRETS_SOURCE=ENV
  // Quando SECRETS_SOURCE=VAULT, são opcionais (serão carregados do Vault antes da validação)
  DB_HOST: Joi.string()
    .when('SECRETS_SOURCE', {
      is: 'ENV',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description(
      'Database host (required when SECRETS_SOURCE=ENV, loaded from Vault when SECRETS_SOURCE=VAULT)',
    ),
  DB_PORT: Joi.number().default(3306).description('Database port'),
  DB_USERNAME: Joi.string()
    .when('SECRETS_SOURCE', {
      is: 'ENV',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description(
      'Database username (required when SECRETS_SOURCE=ENV, loaded from Vault when SECRETS_SOURCE=VAULT)',
    ),
  DB_PASSWORD: Joi.string()
    .when('SECRETS_SOURCE', {
      is: 'ENV',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description(
      'Database password (required when SECRETS_SOURCE=ENV, loaded from Vault when SECRETS_SOURCE=VAULT)',
    ),
  DB_DATABASE: Joi.string().required().description('Database name'),

  // TypeORM Configuration
  TYPEORM_SYNCHRONIZE: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('TypeORM synchronize option (should be false in production)'),
  TIME_ZONE: Joi.string().default('Z').description('Database timezone'),

  // JWT Configuration
  // JWT_SECRET é obrigatório apenas quando SECRETS_SOURCE=ENV
  // Quando SECRETS_SOURCE=VAULT, é opcional (será carregado do Vault antes da validação)
  JWT_SECRET: Joi.string()
    .when('SECRETS_SOURCE', {
      is: 'ENV',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description(
      'JWT secret key (required when SECRETS_SOURCE=ENV, loaded from Vault when SECRETS_SOURCE=VAULT)',
    ),
  JWT_EXPIRES_IN: Joi.string()
    .default('15m')
    .description('JWT access token expiration'),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d')
    .description('JWT refresh token expiration'),
  JWT_ISSUER: Joi.string().optional().description('JWT issuer'),

  // Redis Configuration
  REDIS_HOST: Joi.string().default('localhost').description('Redis host'),
  REDIS_PORT: Joi.number().default(6379).description('Redis port'),
  REDIS_PASSWORD: Joi.string().optional().description('Redis password'),
  REDIS_DB: Joi.number().default(0).description('Redis database number'),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number()
    .default(60)
    .description('Rate limit time window in seconds'),
  RATE_LIMIT_MAX: Joi.number()
    .default(100)
    .description('Maximum requests per time window'),

  // Application Configuration
  PORT: Joi.number().default(3000).description('Application port'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Node environment'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info')
    .description('Logging level'),
  LOG_DESTINATION: Joi.string()
    .valid('console', 'cloud', 'oci', 'both')
    .default('console')
    .description(
      'Log destination: console, cloud, oci, or both. Default: console',
    ),

  // Cloud Logging Configuration
  CLOUD_LOGGING_PROVIDER: Joi.string()
    .valid('oci', 'aws', 'gcp', 'none')
    .default('oci')
    .description('Cloud logging provider: oci, aws, gcp, none. Default: oci'),

  // OCI Logging Configuration
  OCI_REGION: Joi.string()
    .optional()
    .description(
      'Oracle Cloud region (e.g., us-ashburn-1) - generic variable for all OCI services (Vault, Logging, etc.)',
    ),
  OCI_LOGGING_LOG_GROUP_OCID: Joi.string()
    .when('LOG_DESTINATION', {
      is: Joi.any().valid('cloud', 'oci', 'both'),
      then: Joi.when('CLOUD_LOGGING_PROVIDER', {
        is: 'oci',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      otherwise: Joi.optional(),
    })
    .description(
      'OCID of the Log Group in OCI (required when LOG_DESTINATION is cloud/oci/both and CLOUD_LOGGING_PROVIDER is oci)',
    ),
  OCI_LOGGING_LOG_ID: Joi.string()
    .when('LOG_DESTINATION', {
      is: Joi.any().valid('cloud', 'oci', 'both'),
      then: Joi.when('CLOUD_LOGGING_PROVIDER', {
        is: 'oci',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      otherwise: Joi.optional(),
    })
    .description(
      'OCID of the Log within the Log Group (required when LOG_DESTINATION is cloud/oci/both and CLOUD_LOGGING_PROVIDER is oci). ' +
        'This is different from the Log Group OCID. You need to create a Log within the Log Group first.',
    ),
  OCI_LOGGING_COMPARTMENT_OCID: Joi.string()
    .optional()
    .description(
      'OCID of the compartment where logs are stored (optional, will be inferred if not provided)',
    ),

  // Health Check Configuration
  HEALTH_MEMORY_HEAP_THRESHOLD_MB: Joi.number()
    .default(500)
    .description('Memory heap threshold in MB for health check'),
  HEALTH_MEMORY_RSS_THRESHOLD_MB: Joi.number()
    .default(1000)
    .description('Memory RSS threshold in MB for health check'),

  // Webhook Configuration
  WEBHOOK_ENCRYPTION_KEY: Joi.string()
    .min(32)
    .optional()
    .description(
      'Encryption key for webhook secrets (min 32 characters). Required for webhook functionality.',
    ),

  // Sensitive Fields (comma-separated list)
  SENSITIVE_FIELDS: Joi.string()
    .optional()
    .description(
      'Comma-separated list of sensitive fields to remove from responses',
    ),

  // Storage Configuration
  STORAGE_TYPE: Joi.string()
    .valid('LOCAL', 'S3', 'R2', 'AZURE_BLOB', 'GOOGLE_CLOUD_STORAGE')
    .default('LOCAL')
    .description(
      'Storage type (LOCAL, S3, R2, AZURE_BLOB, GOOGLE_CLOUD_STORAGE). Default: LOCAL',
    ),
  STORAGE_LOCAL_PATH: Joi.string()
    .optional()
    .description('Local storage path (default: storage/documents)'),

  // S3 Configuration (only required when STORAGE_TYPE=S3)
  S3_BUCKET: Joi.string().optional().description('S3 bucket name'),
  S3_REGION: Joi.string()
    .optional()
    .default('us-east-1')
    .description('S3 region'),
  S3_ACCESS_KEY_ID: Joi.string().optional().description('S3 access key ID'),
  S3_SECRET_ACCESS_KEY: Joi.string()
    .optional()
    .description('S3 secret access key'),
  S3_ENDPOINT: Joi.string().optional().description('S3 custom endpoint'),

  // Cloudflare R2 Configuration (only required when STORAGE_TYPE=R2)
  R2_ACCOUNT_ID: Joi.string()
    .optional()
    .description('Cloudflare Account ID for R2'),
  R2_BUCKET: Joi.string().optional().description('R2 bucket name'),
  R2_ACCESS_KEY_ID: Joi.string().optional().description('R2 access key ID'),
  R2_SECRET_ACCESS_KEY: Joi.string()
    .optional()
    .description('R2 secret access key'),
  R2_PUBLIC_URL: Joi.string()
    .optional()
    .description(
      'R2 public domain URL (optional, for public bucket access without signed URLs)',
    ),

  // Additional S3 Providers (e.g., S3_PROVIDER_1_BUCKET, S3_PROVIDER_1_REGION, etc.)
  // These are validated dynamically if present

  // Oracle Vault Configuration
  SECRETS_SOURCE: Joi.string()
    .valid('VAULT', 'ENV')
    .default('ENV')
    .description(
      'Source for secrets: VAULT (Oracle Vault) or ENV (.env file). Default: ENV',
    ),
  OCI_CONFIG_FILE: Joi.string()
    .optional()
    .description('Path to OCI config file (default: ~/.oci/config)'),
  OCI_PROFILE: Joi.string()
    .optional()
    .description('OCI profile name to use (default: DEFAULT)'),
  VAULT_OCID: Joi.string()
    .optional()
    .description(
      'OCID of the Vault where secrets are stored (required when SECRETS_SOURCE=VAULT)',
    ),
  VAULT_COMPARTMENT_OCID: Joi.string()
    .optional()
    .description(
      'OCID of the compartment where secrets are stored (optional, will be fetched from Vault if not provided)',
    ),
  VAULT_REGION: Joi.string()
    .optional()
    .description(
      'Oracle Cloud region (e.g., us-ashburn-1) (required when SECRETS_SOURCE=VAULT). Deprecated: use OCI_REGION instead (fallback for compatibility)',
    ),
});
