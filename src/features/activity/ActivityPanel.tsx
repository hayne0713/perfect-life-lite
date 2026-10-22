import { useMemo, useState, type FormEvent } from 'react'
import { Activity, Pencil, Play, Plus, Square, Trash2 } from 'lucide-react'
import { activityTotalsForDate, durationMs, formatDuration, formatTime, makeId, type ActivitySession } from '../../data'
import { dateTimeFromInput, dateTimeInput, intervalTouchesDate } from '../../shared/date'

type Props = {
  date: string
  isToday: boolean
  sessions: ActivitySession[]
  active: ActivitySession | null
  now: number
  onStart: (name: string) => void
  onStop: (id: string) => void
  onSave: (record: ActivitySession) => void
  onDelete: (id: string) => void
}

export function ActivityPanel({ date, isToday, sessions, active, now, onStart, onStop, onSave, onDelete }: Props) {
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<ActivitySession | 'new' | null>(null)
  const [error, setError] = useState('')
  const rows = useMemo(() => sessions.filter(item => intervalTouchesDate(item.startAt, item.endAt, date, now)).sort((a, b) => a.startAt.localeCompare(b.startAt)), [sessions, date, now])
  const totals = activityTotalsForDate(sessions, date, now)
  const activeMinutes = active ? Math.floor(durationMs(active.startAt, null, now) / 60000) : 0

  function begin(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) { setError('請輸入活動名稱。'); return }
    setError('')
    onStart(name.trim())
    setName('')
  }

  function saveManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const cleanName = String(form.get('name')).trim()
    const startLocal = String(form.get('startAt'))
    const endLocal = String(form.get('endAt'))
    if (!cleanName || !startLocal || !endLocal || new Date(endLocal) <= new Date(startLocal)) {
      setError('請填寫活動名稱，並確認結束時間晚於開始時間。')
      return
    }
    const old = editing !== 'new' && editing ? editing : undefined
    const startAt = dateTimeFromInput(startLocal)
    const endAt = dateTimeFromInput(endLocal)
    const timestamp = new Date().toISOString()
    onSave({ id: old?.id ?? makeId(), name: cleanName, startAt, endAt, createdAt: old?.createdAt ?? timestamp, updatedAt: timestamp })
    setEditing(null)
    setError('')
  }

  const sameNameActive = active && active.name === name.trim()

  return <section className="panel activity-panel">
    <div className="panel-heading"><div className="section-title"><span className="section-icon activity-icon"><Activity size={18} /></span><div><p className="eyebrow">ACTIVITY LOG</p><h2>活動計時</h2></div></div><span className="section-caption">{formatDuration(Math.round(totals.reduce((sum, item) => sum + item.minutes, 0)))}</span></div>

    {active && <div className="active-timer"><div><span className="live-dot" /><span>正在進行</span><strong>{active.name}</strong><small>開始於 {formatTime(active.startAt)} · 已 {formatDuration(activeMinutes)}</small></div><button className="stop-button" onClick={() => onStop(active.id)}><Square size={15} fill="currentColor" />結束</button></div>}

    {isToday ? <form className="activity-start" onSubmit={begin}>
      <label className="sr-only" htmlFor="activity-name">活動名稱</label>
      <input id="activity-name" value={name} onChange={event => setName(event.target.value)} placeholder="現在要做什麼？例如：閱讀、工作" maxLength={80} />
      <button className={sameNameActive ? 'stop-button' : 'start-button'} type={sameNameActive ? 'button' : 'submit'} onClick={sameNameActive ? () => onStop(active.id) : undefined}>
        {sameNameActive ? <><Square size={14} fill="currentColor" />結束</> : <><Play size={15} fill="currentColor" />{active ? '切換活動' : '開始'}</>}
      </button>
    </form> : <div className="past-actions"><button className="secondary-button" onClick={() => { setEditing('new'); setError('') }}><Plus size={15} />補登活動</button></div>}
    {isToday && <button className="rest-button" onClick={() => onStart('休息')}>開始休息計時</button>}
    {error && !editing && <p className="inline-error">{error}</p>}

    {totals.length > 0 && <div className="activity-totals"><p className="subheading">活動總時數</p>{totals.map(item => <div className="total-row" key={item.name}><span>{item.name}</span><strong>{formatDuration(item.minutes)}</strong></div>)}</div>}
    <div className="activity-timeline"><p className="subheading">時間紀錄</p>
      {rows.length ? rows.map(item => <article className="timeline-row" key={item.id}>
        <div className="timeline-time">{formatTime(item.startAt)}<span>{item.endAt ? formatTime(item.endAt) : '進行中'}</span></div>
        <div className="timeline-line"><i /></div>
        <div className="timeline-copy"><strong>{item.name}</strong><small>{formatDuration(Math.floor(durationMs(item.startAt, item.endAt, now) / 60000))}</small></div>
        {!item.endAt && <span className="recording-tag">計時中</span>}
        {item.endAt && <div className="row-actions"><button aria-label="編輯活動" onClick={() => { setEditing(item); setError('') }}><Pencil size={15} /></button><button aria-label="刪除活動" onClick={() => onDelete(item.id)}><Trash2 size={15} /></button></div>}
      </article>) : <p className="empty-state">這一天還沒有活動紀錄。你可以開始計時，或補登過去的活動。</p>}
    </div>

    {editing && <div className="inline-editor"><div className="editor-heading"><strong>{editing === 'new' ? '補登活動' : '修改活動紀錄'}</strong><button onClick={() => setEditing(null)}>取消</button></div><form onSubmit={saveManual}>
      <label className="field">活動名稱<input name="name" required maxLength={80} defaultValue={editing === 'new' ? '' : editing.name} /></label>
      <div className="field-row"><label className="field">開始時間<input name="startAt" type="datetime-local" required defaultValue={editing === 'new' ? `${date}T09:00` : dateTimeInput(editing.startAt)} /></label><label className="field">結束時間<input name="endAt" type="datetime-local" required defaultValue={editing === 'new' ? `${date}T09:30` : dateTimeInput(editing.endAt ?? new Date().toISOString())} /></label></div>
      {error && <p className="inline-error">{error}</p>}<button className="start-button" type="submit">儲存紀錄</button>
    </form></div>}
  </section>
}
