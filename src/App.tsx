import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownToLine, Check, CloudOff, Leaf, Upload } from 'lucide-react'
import {
  deleteRecord, exportAll, formatDuration, importAll, intervalMinutesByDay, loadAllRecords,
  localDate, saveActivity, saveMeal, saveSleep, saveTask, startActivity, startSleep,
  stopActivity, stopSleep, type ActivitySession, type LifeRecords, type MealRecord,
  type SleepRecord, type TaskRecord,
} from './data'
import { CalendarPanel } from './features/calendar/CalendarPanel'
import { ActivityPanel } from './features/activity/ActivityPanel'
import { SleepPanel } from './features/sleep/SleepPanel'
import { ReminderPanel } from './features/reminders/ReminderPanel'
import { MealPanel } from './features/meals/MealPanel'
import { addDays } from './shared/date'

const emptyRecords: LifeRecords = { sleep: [], tasks: [], meals: [], activities: [] }

function dayName(date: string) {
  return new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${date}T12:00:00`))
}

export default function App() {
  const [date, setDate] = useState(localDate())
  const [records, setRecords] = useState<LifeRecords>(emptyRecords)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState('')
  const importInput = useRef<HTMLInputElement>(null)
  const today = localDate()
  const isToday = date === today
  const activeActivity = records.activities.find(item => !item.endAt) ?? null
  const activeSleep = records.sleep.find(item => !item.endAt) ?? null
  const activityMinutes = useMemo(() => records.activities.reduce((total, item) => total + (intervalMinutesByDay(item.startAt, item.endAt, date === today ? now : new Date(`${addDays(date, 1)}T00:00:00`).getTime()).get(date) ?? 0), 0), [records.activities, date, today, now])
  const pendingDue = records.tasks.filter(task => !task.completed && (task.date === date || (isToday && task.date < today))).length
  const hasSleep = records.sleep.some(item => intervalMinutesByDay(item.startAt, item.endAt, now).has(date))
  const hasMeals = records.meals.some(item => item.date === date)
  const hasActivity = records.activities.some(item => intervalMinutesByDay(item.startAt, item.endAt, now).has(date))

  const reload = useCallback(async () => {
    setRecords(await loadAllRecords())
    setLoading(false)
  }, [])

  useEffect(() => { void reload().catch(() => { setToast('無法讀取本機資料。'); setLoading(false) }) }, [reload])
  useEffect(() => {
    let timer = 0
    const resume = () => {
      window.clearInterval(timer)
      if (document.visibilityState === 'visible') {
        setNow(Date.now())
        timer = window.setInterval(() => setNow(Date.now()), 1000)
      }
    }
    resume()
    document.addEventListener('visibilitychange', resume)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', resume) }
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function act(action: () => Promise<unknown>, message?: string) {
    try { await action(); await reload(); if (message) setToast(message) }
    catch (error) { setToast(error instanceof Error ? error.message : '操作失敗，請再試一次。') }
  }

  async function saveSleepRecord(record: SleepRecord) { await act(() => saveSleep(record), '睡眠紀錄已儲存。') }
  async function saveActivityRecord(record: ActivitySession) { await act(() => saveActivity(record), '活動紀錄已儲存。') }
  async function saveReminder(task: TaskRecord) { await act(() => saveTask(task), '提醒已更新。') }
  async function saveMealRecord(meal: MealRecord) { await act(() => saveMeal(meal), '飲食紀錄已儲存。') }
  async function remove(kind: 'sleep' | 'tasks' | 'meals' | 'activities', id: string) { await act(() => deleteRecord(kind, id), '紀錄已刪除。') }

  async function downloadBackup() {
    try {
      const data = await exportAll()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `perfect-life-backup-${today}.json`
      link.click()
      URL.revokeObjectURL(url)
      setToast('備份已匯出。')
    } catch { setToast('匯出失敗，請再試一次。') }
  }

  async function restoreBackup(file?: File) {
    if (!file) return
    try {
      const value: unknown = JSON.parse(await file.text())
      if (!window.confirm('匯入會取代這台裝置目前的所有紀錄，確定要繼續嗎？')) return
      await importAll(value)
      await reload()
      setToast('資料已還原。')
    } catch (error) { setToast(error instanceof Error ? error.message : '無法還原這份備份。') }
    finally { if (importInput.current) importInput.current.value = '' }
  }

  if (loading) return <main className="loading-screen"><div className="brand-mark"><Leaf size={22} /></div><p>正在打開你的生活紀錄…</p></main>

  return <main className="app-shell">
    <header className="app-header">
      <div className="brand"><div className="brand-mark"><Leaf size={20} /></div><div><span className="eyebrow">YOUR PERSONAL LIFEBOOK</span><h1>Perfect Life Lite</h1></div></div>
      <span className="local-badge"><CloudOff size={14} />只存在這台裝置</span>
    </header>

    <section className="welcome-panel">
      <p className="eyebrow">{isToday ? 'TODAY' : 'DAILY REVIEW'}</p>
      <h2>{isToday ? '把日子，慢慢記下來。' : dayName(date)}</h2>
      <p>{isToday ? '做一件事，記一段生活；不用一次做到完美。' : '回看這一天的生活紀錄。'}</p>
      {!isToday && <button className="today-link" onClick={() => setDate(today)}>回到今天</button>}
    </section>

    <CalendarPanel selectedDate={date} records={records} onSelect={setDate} />

    <section className="day-summary" aria-label="當日紀錄摘要">
      <div><strong>{formatDuration(Math.round(activityMinutes))}</strong><span>活動時間</span></div>
      <div><strong>{pendingDue}</strong><span>待完成提醒</span></div>
      <div><strong>{[hasSleep, hasActivity, hasMeals].filter(Boolean).length}/3</strong><span>生活紀錄</span></div>
    </section>

    <div className="feature-grid">
      <ActivityPanel date={date} isToday={isToday} sessions={records.activities} active={activeActivity} now={now}
        onStart={name => { void act(() => startActivity(name), `${name} 已開始計時。`) }}
        onStop={id => { void act(() => stopActivity(id), '活動計時已結束。') }}
        onSave={record => { void saveActivityRecord(record) }} onDelete={id => { void remove('activities', id) }} />
      <div className="side-column">
        <ReminderPanel date={date} today={today} tasks={records.tasks} onSave={task => { void saveReminder(task) }} onDelete={id => { void remove('tasks', id) }} />
        <SleepPanel date={date} isToday={isToday} records={records.sleep} active={activeSleep} now={now}
          onStart={() => { void act(() => startSleep(), '睡眠計時已開始。') }} onStop={() => { void act(() => stopSleep(), '起床時間已記錄。') }}
          onSave={record => { void saveSleepRecord(record) }} onDelete={id => { void remove('sleep', id) }} />
      </div>
      <MealPanel date={date} meals={records.meals} onSave={meal => { void saveMealRecord(meal) }} onDelete={id => { void remove('meals', id) }} />
    </div>

    <section className="backup-panel"><div><strong>你的資料只存在本機</strong><p>定期匯出備份，換手機時可再匯入還原。</p></div><button className="secondary-button" onClick={() => void downloadBackup()}><ArrowDownToLine size={16} />匯出備份</button><button className="secondary-button" onClick={() => importInput.current?.click()}><Upload size={15} />匯入</button><input ref={importInput} type="file" accept="application/json,.json" hidden onChange={event => void restoreBackup(event.target.files?.[0])} /></section>
    <footer className="privacy-note"><Check size={14} />離線可用 · 不需帳號 · 你的照片與紀錄保存在此裝置</footer>
    {toast && <div role="status" className="toast">{toast}</div>}
  </main>
}
