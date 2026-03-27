function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toPayload(event: unknown): Record<string, unknown> {
  if (isRecord(event)) {
    return { ...event };
  }
  if (Array.isArray(event)) {
    return { items: event };
  }
  return { value: event };
}
