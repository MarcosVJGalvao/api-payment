export function extractModuleFromPath(filePath?: string): string | undefined {
  if (!filePath) {
    return undefined;
  }

  const normalizedPath = filePath
    .replace(/\\/g, '/')
    .replace(/^.*\/src\//, '')
    .replace(/\.(ts|js)$/, '');

  const pathParts = normalizedPath.split('/');

  if (pathParts.length > 0) {
    const moduleName = pathParts[0];

    if (moduleName === 'common') {
      if (pathParts.length > 1) {
        return `common.${pathParts[1]}`;
      }
      return 'common';
    }

    return moduleName;
  }

  return undefined;
}

export function extractModuleFromStack(stack?: string): string | undefined {
  if (!stack) {
    return undefined;
  }

  const stackLines = stack.split('\n');

  for (const line of stackLines) {
    const match = line.match(/\(([^)]+\.(ts|js)):\d+:\d+\)/);
    if (match && match[1]) {
      const module = extractModuleFromPath(match[1]);
      if (module) {
        return module;
      }
    }
  }

  return undefined;
}

export function extractModuleFromContext(
  context?: string,
  meta?: Record<string, any>,
): string | undefined {
  if (context) {
    const normalized = context.toLowerCase().replace(/service$/, '');
    return normalized;
  }

  if (meta?.module) {
    return String(meta.module);
  }

  if (meta?.context) {
    const normalized = String(meta.context)
      .toLowerCase()
      .replace(/service$/, '');
    return normalized;
  }

  return undefined;
}

export function getModuleName(
  context?: string,
  meta?: Record<string, any>,
  stack?: string,
): string {
  if (meta?.module && typeof meta.module === 'string') {
    return meta.module.toLowerCase();
  }

  const fromContext = extractModuleFromContext(context, meta);
  if (fromContext && fromContext !== 'requestlogginginterceptor') {
    return fromContext;
  }

  const fromStack = extractModuleFromStack(stack);
  if (fromStack) {
    return fromStack;
  }

  return 'unknown';
}
