import test from 'node:test'
import assert from 'node:assert/strict'
import { activityTotalsForDate, closeInterval, durationMs, intervalMinutesByDay } from '../src/shared/time.js'

test('duration uses stored timestamps and never returns negative time', () => {
  const start = new Date(2026, 9, 20, 9).toISOString()
  assert.equal(durationMs(start, null, new Date(2026, 9, 20, 10).getTime()), 60 * 60 * 1000)
  assert.equal(durationMs(start, start), 0)
})

test('an interval crossing midnight is split by the local calendar day', () => {
  const start = new Date(2026, 9, 20, 23, 30).toISOString()
  const end = new Date(2026, 9, 21, 1, 30).toISOString()
  const result = intervalMinutesByDay(start, end)
  assert.equal(result.get('2026-10-20'), 30)
  assert.equal(result.get('2026-10-21'), 90)
})

test('repeated same-name sessions aggregate for the selected date', () => {
  const day = new Date(2026, 9, 20, 0)
  const sessions = [
    { name: '閱讀', startAt: new Date(2026, 9, 20, 9).toISOString(), endAt: new Date(2026, 9, 20, 10).toISOString() },
    { name: '閱讀', startAt: new Date(2026, 9, 20, 14).toISOString(), endAt: new Date(2026, 9, 20, 14, 30).toISOString() },
    { name: '散步', startAt: new Date(2026, 9, 20, 15).toISOString(), endAt: new Date(2026, 9, 20, 15, 15).toISOString() },
  ]
  assert.deepEqual(activityTotalsForDate(sessions, `${day.getFullYear()}-10-20`), [
    { name: '閱讀', minutes: 90 }, { name: '散步', minutes: 15 },
  ])
})

test('switching an interval closes it at the exact handoff timestamp', () => {
  const active = { id: 'a', name: '工作', startAt: '2026-10-20T01:00:00.000Z', endAt: null, createdAt: '2026-10-20T01:00:00.000Z', updatedAt: '2026-10-20T01:00:00.000Z' }
  const handoff = '2026-10-20T02:15:00.000Z'
  assert.deepEqual(closeInterval(active, handoff), { ...active, endAt: handoff, updatedAt: handoff })
})
