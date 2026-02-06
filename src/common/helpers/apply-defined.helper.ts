export function applyDefined<T extends object, K extends keyof T>(
  target: T,
  source: Partial<T>,
  keys: readonly K[],
): void {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined) {
      target[key] = value;
    }
  }
}
