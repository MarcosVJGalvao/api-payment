/**
 * Request formatting helpers
 */

import { Request } from 'express';
import { isEmptyObject, isRecord } from './type.helpers';

const SENSITIVE_FIELDS = [
  'password',
  'oldPassword',
  'newPassword',
  'token',
  'authorization',
];

export function formatData(data: any, emptyMessage: string) {
  if (!data || isEmptyObject(data)) {
    return emptyMessage;
  }
  return data;
}

export function redactSensitiveFields(
  data: Record<string, any>,
): Record<string, any> {
  const result = { ...data };
  for (let i = 0; i < SENSITIVE_FIELDS.length; i++) {
    const field = SENSITIVE_FIELDS[i];
    if (result[field]) {
      result[field] = '***REDACTED***';
    }
  }
  return result;
}

export function formatRequest(request: Request) {
  const formatBody = (body: any) => {
    const formatted = formatData(body, 'No body parameters provided');
    if (typeof formatted === 'string') return formatted;
    if (isRecord(formatted)) {
      return redactSensitiveFields(formatted);
    }
    return formatted;
  };

  const formatHeaders = () => {
    const headers = { ...request.headers };
    if (headers.authorization) {
      headers.authorization = '***REDACTED***';
    }
    return headers;
  };

  return {
    method: request.method,
    url: request.url,
    headers: formatHeaders(),
    query: formatData(request.query, 'No query parameters provided'),
    params: formatData(request.params, 'No path parameters provided'),
    body: formatBody(request.body),
  };
}
