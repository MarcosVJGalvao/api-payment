/**
 * Type guard helpers for safe type checking
 */

export function isRecord(value: unknown): value is Record<string, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
}

export function isEmptyObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || obj === null) return false;
  const keys = Object.keys(obj as Record<string, unknown>);
  return keys.length === 0;
}
