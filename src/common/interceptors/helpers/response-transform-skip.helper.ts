export type ResponseTransformRequest = {
  url?: string;
  path?: string;
  method?: string;
};

export function shouldSkipResponseTransform(
  request: ResponseTransformRequest,
): boolean {
  const path = request.url || request.path || '';
  const method = request.method || '';

  if (!path) {
    return false;
  }

  if (
    path === '/api' ||
    path === '/api-json' ||
    path.startsWith('/api/docs') ||
    path.startsWith('/api-json')
  ) {
    return true;
  }

  if (path.endsWith('/download') || path.endsWith('/export')) {
    return true;
  }

  if (path === '/reports' && method === 'POST') {
    return true;
  }

  return false;
}
