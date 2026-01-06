/**
 * Timestamp formatting helpers
 */

import { format } from 'date-fns';

export function getTimestamp(): string {
  const now = new Date();
  return format(now, "yyyy-MM-dd'T'HH:mm:ss.SSS");
}
