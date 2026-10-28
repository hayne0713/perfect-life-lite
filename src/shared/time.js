/** @param {Date} date */
function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** @param {string} startAt @param {string|null} endAt @param {number} [now] */
export function durationMs(startAt, endAt, now = Date.now()) {
  return Math.max(0, (endAt ? new Date(endAt).getTime() : now) - new Date(startAt).getTime())
}

/** @template {{endAt:string|null,updatedAt:string}} T @param {T} record @param {string} at @returns {Omit<T,'endAt'|'updatedAt'> & {endAt:string,updatedAt:string}} */
export function closeInterval(record, at) {
  return { ...record, endAt: at, updatedAt: at }
}

/** @param {string} startAt @param {string|null} endAt @param {number} [now] */
export function intervalMinutesByDay(startAt, endAt, now = Date.now()) {
  const start = new Date(startAt)
  let cursor = new Date(start)
  const end = new Date(endAt ?? now)
  const result = new Map()
  if (end <= start) return result

  while (cursor < end) {
    const day = localDateKey(cursor)
    const nextDay = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    const sliceEnd = nextDay < end ? nextDay : end
    const minutes = (sliceEnd.getTime() - cursor.getTime()) / 60000
    result.set(day, (result.get(day) ?? 0) + minutes)
    cursor = sliceEnd
  }
  return result
}

/** @param {{name:string,startAt:string,endAt:string|null}[]} sessions @param {string} date @param {number} [now] */
export function activityTotalsForDate(sessions, date, now = Date.now()) {
  const totals = new Map()
  for (const session of sessions) {
    const minutes = intervalMinutesByDay(session.startAt, session.endAt, now).get(date) ?? 0
    if (minutes) totals.set(session.name, (totals.get(session.name) ?? 0) + minutes)
  }
  return [...totals.entries()].map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }))
    .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name, 'zh-TW'))
}
