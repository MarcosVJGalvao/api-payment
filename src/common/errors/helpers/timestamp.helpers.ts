/**
 * Timestamp formatting helpers
 */

import { format } from 'date-fns';
import { getCurrentDate } from '@/common/helpers/date.helpers';

export function getTimestamp(): string {
  const now = getCurrentDate();
  return format(now, "yyyy-MM-dd'T'HH:mm:ss.SSS");
}
