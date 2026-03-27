/**
 * Type guard helpers for safe type checking
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
}

export function isEmptyObject(obj: unknown): boolean {
  if (!isRecord(obj)) {
    return false;
  }

  return Object.keys(obj).length === 0;
}
