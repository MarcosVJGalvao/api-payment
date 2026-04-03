import {
  ONE_HOUR_IN_SECONDS,
  PERMISSIONS_CACHE_TTL_SECONDS,
  PROVIDER_SESSION_TTL_SECONDS,
  SHARED_BACKOFFICE_TOKEN_TTL_SECONDS,
} from '../constants/queue.constants';

export const RedisKeyPrefixes = {
  providerSession: 'provider_session:',
  sharedBackofficeToken: 'hiperbanco:shared_backoffice_token',
  clientPermissions: 'client_permissions:',
  clientDirectPermissions: 'client_direct_permissions:',
  clientRoles: 'client_roles:',
  throttler: 'throttler:',
};

export const RedisPolicies = {
  providerSessionTtlSeconds: PROVIDER_SESSION_TTL_SECONDS,
  sharedBackofficeTokenTtlSeconds: SHARED_BACKOFFICE_TOKEN_TTL_SECONDS,
  permissionsCacheTtlSeconds: PERMISSIONS_CACHE_TTL_SECONDS,
  auditFailureRetentionSeconds: ONE_HOUR_IN_SECONDS,
  webhookFailureRetentionSeconds: ONE_HOUR_IN_SECONDS,
};
