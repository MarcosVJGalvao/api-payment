export interface ParsedPermission {
  module: string;
  action: string;
}

/**
 * Faz o parse de uma string de permissão no formato "module:action"
 * @param permission - String de permissão no formato "module:action"
 * @returns Objeto com module e action, ou null se o formato for inválido
 */
export function parsePermission(permission: string): ParsedPermission | null {
  const parts = permission.split(':');
  if (parts.length !== 2) {
    return null;
  }

  return {
    module: parts[0],
    action: parts[1],
  };
}

/**
 * Verifica se uma permissão do usuário corresponde à permissão requerida
 * @param required - Permissão requerida (parseada)
 * @param userPerm - Permissão do usuário (string)
 * @returns true se a permissão do usuário corresponde à requerida
 */
export function matchesPermission(
  required: ParsedPermission,
  userPerm: string,
): boolean {
  const userParsed = parsePermission(userPerm);
  if (!userParsed) {
    return false;
  }

  if (
    userParsed.module === required.module &&
    userParsed.action === required.action
  ) {
    return true;
  }

  if (userParsed.module === '*' && userParsed.action === '*') {
    return true;
  }

  if (userParsed.module === required.module && userParsed.action === '*') {
    return true;
  }

  if (
    userParsed.module === required.module &&
    userParsed.action === 'write' &&
    (required.action === 'create' || required.action === 'update')
  ) {
    return true;
  }

  return false;
}

/**
 * Verifica se o usuário tem a permissão requerida, considerando hierarquia
 * @param userPermissions - Array de permissões do usuário
 * @param requiredPermission - Permissão requerida
 * @returns true se o usuário tem a permissão
 */
export function checkPermissionHierarchy(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  const required = parsePermission(requiredPermission);
  if (!required) {
    return false;
  }

  if (userPermissions.includes('*:*')) {
    return true;
  }

  const moduleWildcard = `${required.module}:*`;
  if (userPermissions.includes(moduleWildcard)) {
    return true;
  }

  if (
    (required.action === 'create' || required.action === 'update') &&
    userPermissions.includes(`${required.module}:write`)
  ) {
    return true;
  }

  return false;
}
