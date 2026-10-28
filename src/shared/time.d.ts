export function durationMs(startAt: string, endAt: string | null, now?: number): number
export function closeInterval<T extends { endAt: string | null; updatedAt: string }>(
  record: T,
  at: string,
): Omit<T, 'endAt' | 'updatedAt'> & { endAt: string; updatedAt: string }
export function intervalMinutesByDay(startAt: string, endAt: string | null, now?: number): Map<string, number>
export function activityTotalsForDate(
  sessions: { name: string; startAt: string; endAt: string | null }[],
  date: string,
  now?: number,
): { name: string; minutes: number }[]
