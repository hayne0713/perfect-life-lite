import { useState, type FormEvent } from 'react'
import { AlarmClock, Moon, Pencil, Play, Square, Trash2 } from 'lucide-react'
import { durationMs, formatDuration, formatTime, makeId, type SleepRecord } from '../../data'
import { addDays, dateTimeFromInput, dateTimeInput, intervalTouchesDate } from '../../shared/date'

type Props = {
  date: string
  isToday: boolean
  records: SleepRecord[]
  active: SleepRecord | null
  now: number
  onStart: () => void
  onStop: () => void
  onSave: (record: SleepRecord) => void
  onDelete: (id: string) => void
}

export function SleepPanel({ date, isToday, records, active, now, onStart, onStop, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<SleepRecord | 'new' | null>(null)
  const [error, setError] = useState('')
  const dayRecords = records.filter(record => intervalTouchesDate(record.startAt, record.endAt, date, now)).sort((a, b) => a.startAt.localeCompare(b.startAt))

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const startLocal = String(form.get('startAt'))
    const endLocal = String(form.get('endAt'))
    if (!startLocal || !endLocal || new Date(endLocal) <= new Date(startLocal)) {
      setError('起床時間必須晚於入睡時間。')
      return
    }
    const old = editing !== 'new' && editing ? editing : undefined
    const timestamp = new Date().toISOString()
    onSave({ id: old?.id ?? makeId(), startAt: dateTimeFromInput(startLocal), endAt: dateTimeFromInput(endLocal), updatedAt: timestamp })
    setEditing(null)
    setError('')
  }

  const liveMinutes = active ? Math.floor(durationMs(active.startAt, null, now) / 60000) : 0

  return <section className="panel sleep-panel">
    <div className="panel-heading"><div className="section-title"><span className="section-icon sleep-icon"><Moon size={18} /></span><div><p className="eyebrow">SLEEP</p><h2>睡眠紀錄</h2></div></div></div>
    {active ? <div className="active-timer sleep-active"><div><span className="live-dot sleep-live" /><span>睡眠計時中</span><strong>已 {formatDuration(liveMinutes)}</strong><small>入睡於 {formatTime(active.startAt)}</small></div><button className="stop-button" onClick={onStop}><Square size={15} fill="currentColor" />起床</button></div> : isToday ? <div className="sleep-start"><p>準備休息時開始，起床後結束計時。</p><button className="sleep-button" onClick={onStart}><Play size={15} fill="currentColor" />開始睡眠計時</button></div> : null}
    {dayRecords.length ? <div className="sleep-list">{dayRecords.map(record => <article className="simple-record" key={record.id}><div className="record-icon"><AlarmClock size={16} /></div><div className="simple-record-copy"><strong>{formatTime(record.startAt)}{record.endAt ? ` – ${formatTime(record.endAt)}` : ' – 進行中'}</strong><small>{record.endAt ? formatDuration(Math.round(durationMs(record.startAt, record.endAt) / 60000)) : '計時尚未結束'}</small></div>{record.endAt && <div className="row-actions"><button aria-label="編輯睡眠紀錄" onClick={() => { setEditing(record); setError('') }}><Pencil size={15} /></button><button aria-label="刪除睡眠紀錄" onClick={() => onDelete(record.id)}><Trash2 size={15} /></button></div>}</article>)}</div> : <p className="empty-state">這一天還沒有睡眠紀錄。</p>}
    {!isToday && <button className="secondary-button" onClick={() => { setEditing('new'); setError('') }}>補登睡眠</button>}
    {editing && <div className="inline-editor"><div className="editor-heading"><strong>{editing === 'new' ? '補登睡眠' : '修改睡眠紀錄'}</strong><button onClick={() => setEditing(null)}>取消</button></div><form onSubmit={save}>
      <label className="field">入睡時間<input name="startAt" type="datetime-local" required defaultValue={editing === 'new' ? `${date}T23:00` : dateTimeInput(editing.startAt)} /></label>
      <label className="field">起床時間<input name="endAt" type="datetime-local" required defaultValue={editing === 'new' ? `${addDays(date, 1)}T07:00` : dateTimeInput(editing.endAt ?? new Date().toISOString())} /></label>
      {error && <p className="inline-error">{error}</p>}<button className="start-button" type="submit">儲存紀錄</button>
    </form></div>}
  </section>
}
