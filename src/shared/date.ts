import { intervalMinutesByDay, localDate } from '../data'

export function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + amount)
  return localDate(value)
}

export function dateTimeInput(value: string) {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function dateTimeFromInput(value: string) {
  return new Date(value).toISOString()
}

export function intervalTouchesDate(startAt: string, endAt: string | null, date: string, now = Date.now()) {
  return intervalMinutesByDay(startAt, endAt, now).has(date)
}

export function monthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return { date: localDate(day), inMonth: day.getMonth() === month }
  })
}
