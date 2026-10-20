import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  AlarmClock, ArrowDownToLine, ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2,
  ChevronDown, Circle, Clock3, Coffee, FileUp, ImagePlus, Moon, Plus, Sparkles, Sun,
  Trash2, Utensils, X,
} from 'lucide-react'
import {
  exportAll, formatDuration, formatTime, getDb, localDate, localDateTime, makeId,
  sleepMinutes, importAll, type MealRecord, type MealType, type SleepRecord, type TaskRecord,
} from './data'

type ModalState = { kind: 'sleep'; record?: SleepRecord } | { kind: 'task'; record?: TaskRecord } | { kind: 'meal'; record?: MealRecord; type?: MealType } | null
const mealTypes: MealType[] = ['早餐', '午餐', '晚餐', '其他']
const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'long' })
const fullDate = new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric' })

function dateLabel(date: string) {
  const value = new Date(`${date}T12:00:00`)
  return `${fullDate.format(value)}・${weekday.format(value)}`
}

function nextDate(date: string) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + 1)
  return localDate(value)
}

async function compressPhoto(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('無法處理這張照片。')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.78)
}

export default function App() {
  const [date, setDate] = useState(localDate())
  const [sleep, setSleep] = useState<SleepRecord[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [modal, setModal] = useState<ModalState>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const importInput = useRef<HTMLInputElement>(null)
  const isToday = date === localDate()
  const daySleep = sleep.find(record => record.startAt.slice(0, 10) === date)
  const dayTasks = useMemo(() => tasks.filter(task => task.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [tasks, date])
  const dayMeals = useMemo(() => meals.filter(meal => meal.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [meals, date])
  const taskMinutes = dayTasks.filter(task => task.completed).reduce((sum, task) => sum + task.durationMinutes, 0)
  const missing = [
    !daySleep && '睡眠',
    dayTasks.length === 0 && '任務',
    ...(['早餐', '午餐', '晚餐'] as MealType[]).filter(type => !dayMeals.some(meal => meal.type === type)),
  ].filter(Boolean) as string[]

  async function reload() {
    const db = await getDb()
    const [sleepRows, taskRows, mealRows] = await Promise.all([db.getAll('sleep'), db.getAll('tasks'), db.getAll('meals')])
    setSleep(sleepRows)
    setTasks(taskRows)
    setMeals(mealRows)
    setLoading(false)
  }

  useEffect(() => { void reload() }, [])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  function shiftDate(amount: number) {
    const next = new Date(`${date}T12:00:00`)
    next.setDate(next.getDate() + amount)
    setDate(localDate(next))
  }

  async function deleteRecord(kind: 'sleep' | 'tasks' | 'meals', id: string) {
    const db = await getDb()
    await db.delete(kind, id)
    await reload()
    setToast('紀錄已刪除')
  }

  async function toggleTask(task: TaskRecord) {
    const updated = { ...task, completed: !task.completed }
    const db = await getDb()
    await db.put('tasks', updated)
    setTasks(current => current.map(row => row.id === task.id ? updated : row))
  }

  async function submitSleep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const startAt = localDateTime(String(form.get('startDate')), String(form.get('startTime')))
    const endAt = localDateTime(String(form.get('endDate')), String(form.get('endTime')))
    if (new Date(endAt) <= new Date(startAt)) { setToast('起床時間需要晚於入睡時間'); return }
    const existing = modal?.kind === 'sleep' ? modal.record : daySleep
    const record: SleepRecord = { id: existing?.id ?? makeId(), startAt, endAt, updatedAt: new Date().toISOString() }
    const db = await getDb()
    await db.put('sleep', record)
    await reload()
    setModal(null)
    setToast('睡眠紀錄已儲存')
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title')).trim()
    const hours = Number(form.get('hours') || 0)
    const minutes = Number(form.get('minutes') || 0)
    if (!title) return
    if (hours * 60 + minutes <= 0) { setToast('請輸入任務花費時間'); return }
    const existing = modal?.kind === 'task' ? modal.record : undefined
    const record: TaskRecord = {
      id: existing?.id ?? makeId(), date, title, durationMinutes: hours * 60 + minutes,
      completed: existing?.completed ?? false, createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    const db = await getDb()
    await db.put('tasks', record)
    await reload()
    setModal(null)
    setToast(existing ? '任務已更新' : '任務已新增')
  }

  async function submitMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const description = String(form.get('description')).trim()
    const existing = modal?.kind === 'meal' ? modal.record : undefined
    const photoFile = (form.get('photo') as File | null)
    let photo = existing?.photo
    if (photoFile?.size) {
      try { photo = await compressPhoto(photoFile) } catch { setToast('照片處理失敗，請換一張圖片'); return }
    }
    const record: MealRecord = {
      id: existing?.id ?? makeId(), date, type: String(form.get('type')) as MealType,
      description, photo, createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    const db = await getDb()
    await db.put('meals', record)
    await reload()
    setModal(null)
    setToast(existing ? '飲食紀錄已更新' : '飲食紀錄已新增')
  }

  async function downloadBackup() {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `perfect-life-backup-${localDate()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setToast('備份檔已下載')
  }

  async function restoreBackup(file?: File) {
    if (!file) return
    try {
      const data: unknown = JSON.parse(await file.text())
      if (!window.confirm('匯入會以備份檔取代這台裝置目前的全部紀錄，確定繼續嗎？建議先匯出一份目前資料。')) return
      await importAll(data)
      await reload()
      setToast('資料已還原')
    } catch (error) {
      setToast(error instanceof Error ? error.message : '無法讀取備份檔')
    } finally {
      if (importInput.current) importInput.current.value = ''
    }
  }

  if (loading) return <main className="loading"><div className="brand-mark">P</div><p>正在開啟你的生活紀錄…</p></main>

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">P</div><div><strong>Perfect Life</strong><span>LITE · 生活慢慢記</span></div></div>
      <button className="icon-button backup-trigger" onClick={() => void downloadBackup()} aria-label="匯出備份" title="匯出備份"><ArrowDownToLine size={19} /></button>
    </header>

    <main className="main-content">
      <section className="greeting-row">
        <div><p className="eyebrow">{isToday ? 'GOOD DAY' : 'YOUR JOURNAL'}</p><h1>{isToday ? '今天，過得如何？' : '回顧每一天'}</h1><p className="subheading">把日子記下來，就已經很好了。</p></div>
        <div className="sun-illustration"><Sun size={30} strokeWidth={1.5} /><span /></div>
      </section>

      <section className="date-card" aria-label="選擇日期">
        <button className="icon-button date-arrow" onClick={() => shiftDate(-1)} aria-label="前一天"><ArrowLeft size={18} /></button>
        <label className="date-label"><CalendarDays size={17} /><span>{dateLabel(date)}</span><input aria-label="選擇日期" type="date" value={date} max={localDate()} onChange={event => setDate(event.target.value)} /></label>
        <button className="icon-button date-arrow" onClick={() => shiftDate(1)} disabled={isToday} aria-label="後一天"><ArrowRight size={18} /></button>
        {!isToday && <button className="today-link" onClick={() => setDate(localDate())}>回到今天</button>}
      </section>

      {missing.length > 0 ? <section className="reminder-card"><div className="reminder-icon"><Sparkles size={18} /></div><div><strong>{isToday ? '今天還有一些小事可以記下' : '這一天還有紀錄可以補上'}</strong><p>待補：{missing.join('、')}</p></div><ChevronDown className="reminder-chevron" size={17} /></section>
        : <section className="complete-card"><CheckCircle2 size={19} /><div><strong>今天的紀錄很完整</strong><span>謝謝你為自己留下一點時間。</span></div></section>}

      <div className="section-heading"><div><p className="eyebrow">DAILY NOTES</p><h2>日常紀錄</h2></div><span className="date-small">{date}</span></div>

      <section className="record-card sleep-card">
        <div className="card-topline"><div className="category-icon sleep-icon"><Moon size={20} /></div><div className="category-copy"><span className="category-label">睡眠</span><h3>{daySleep ? formatDuration(sleepMinutes(daySleep)) : '好好休息了嗎？'}</h3></div>{daySleep && <span className="soft-tag">{formatTime(daySleep.startAt)} – {formatTime(daySleep.endAt)}</span>}</div>
        <p className="card-description">{daySleep ? `${daySleep.startAt.slice(0, 10)} 入睡 · ${daySleep.endAt.slice(0, 10)} 起床` : '記下入睡與起床時間，看看自己的休息節奏。'}</p>
        <div className="card-actions">{daySleep && <button className="text-button danger-text" onClick={() => void deleteRecord('sleep', daySleep.id)}><Trash2 size={15} />刪除</button>}<button className="action-button green-action" onClick={() => setModal({ kind: 'sleep', record: daySleep })}>{daySleep ? '編輯紀錄' : <><Plus size={16} />新增紀錄</>}</button></div>
      </section>

      <section className="record-card task-card">
        <div className="card-topline"><div className="category-icon task-icon"><Check size={19} /></div><div className="category-copy"><span className="category-label">每日任務</span><h3>{formatDuration(taskMinutes)} <small>已完成</small></h3></div><span className="count-tag">{dayTasks.filter(task => task.completed).length}/{dayTasks.length} 項</span></div>
        {dayTasks.length ? <div className="task-list">{dayTasks.map(task => <div className={`task-row ${task.completed ? 'is-complete' : ''}`} key={task.id}><button className="task-check" onClick={() => void toggleTask(task)} aria-label={task.completed ? '標記未完成' : '標記完成'}>{task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button><button className="task-name" onClick={() => setModal({ kind: 'task', record: task })}><span>{task.title}</span><small>{formatDuration(task.durationMinutes)}</small></button><button className="mini-delete" onClick={() => void deleteRecord('tasks', task.id)} aria-label="刪除任務"><X size={16} /></button></div>)}</div> : <p className="card-description">完成一件事，也值得記下來。</p>}
        <div className="card-actions"><button className="action-button lavender-action" onClick={() => setModal({ kind: 'task' })}><Plus size={16} />新增任務</button></div>
      </section>

      <section className="record-card meal-card">
        <div className="card-topline"><div className="category-icon meal-icon"><Utensils size={19} /></div><div className="category-copy"><span className="category-label">飲食</span><h3>{dayMeals.length ? `記下 ${dayMeals.length} 餐` : '今天吃了什麼？'}</h3></div><span className="meal-progress">{['早餐', '午餐', '晚餐'].filter(type => dayMeals.some(meal => meal.type === type)).length}/3 餐</span></div>
        <div className="meal-chips">{mealTypes.map(type => { const count = dayMeals.filter(meal => meal.type === type).length; return <button key={type} className={`meal-chip ${count ? 'has-meal' : ''}`} onClick={() => setModal({ kind: 'meal', type })}>{type}{count > 0 && <span>{count}</span>}</button> })}</div>
        {dayMeals.length > 0 ? <div className="meal-list">{dayMeals.map(meal => <article className="meal-row" key={meal.id}><div className="meal-type-dot">{meal.type === '早餐' ? <Coffee size={15} /> : meal.type === '午餐' ? <Sun size={15} /> : <Utensils size={15} />}</div><div className="meal-detail"><div className="meal-row-title"><strong>{meal.type}</strong><button className="meal-edit" onClick={() => setModal({ kind: 'meal', record: meal })}>編輯</button></div>{meal.description && <p>{meal.description}</p>}{meal.photo && <img className="meal-photo" src={meal.photo} alt={`${meal.type}照片`} />}</div><button className="mini-delete" onClick={() => void deleteRecord('meals', meal.id)} aria-label="刪除飲食紀錄"><X size={16} /></button></article>)}</div> : <p className="card-description">簡單寫下餐點，照片也可以一起保存。</p>}
        <div className="card-actions"><button className="action-button peach-action" onClick={() => setModal({ kind: 'meal', type: '早餐' })}><Plus size={16} />新增飲食紀錄</button></div>
      </section>

      <section className="backup-card"><div><strong>你的資料，只留在這台裝置</strong><p>定期匯出備份，換手機時也能帶走紀錄。</p></div><button className="backup-button" onClick={() => void downloadBackup()}><ArrowDownToLine size={16} />備份</button><button className="restore-button" onClick={() => importInput.current?.click()}><FileUp size={16} />還原</button><input ref={importInput} type="file" accept="application/json,.json" hidden onChange={event => void restoreBackup(event.target.files?.[0])} /></section>
      <footer className="footer-note"><span>用自己的步調，好好生活。</span><span>資料儲存在本機 · 離線也能使用</span></footer>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null) }}><section className="modal" role="dialog" aria-modal="true">
      <div className="modal-heading"><div><p className="eyebrow">{modal.kind === 'sleep' ? 'SLEEP' : modal.kind === 'task' ? 'DAILY TASK' : 'MEALS'}</p><h2>{modal.kind === 'sleep' ? (modal.record ? '編輯睡眠紀錄' : '記錄睡眠') : modal.kind === 'task' ? (modal.record ? '編輯任務' : '新增任務') : (modal.record ? '編輯飲食紀錄' : '記錄這一餐')}</h2></div><button className="icon-button" onClick={() => setModal(null)} aria-label="關閉"><X size={19} /></button></div>
      {modal.kind === 'sleep' && <form onSubmit={event => void submitSleep(event)}><div className="field-row"><label className="field">入睡日期<input type="date" name="startDate" required defaultValue={modal.record?.startAt.slice(0, 10) ?? date} /></label><label className="field">入睡時間<input type="time" name="startTime" required defaultValue={modal.record?.startAt.slice(11, 16) ?? '23:00'} /></label></div><div className="field-row"><label className="field">起床日期<input type="date" name="endDate" required defaultValue={modal.record?.endAt.slice(0, 10) ?? nextDate(date)} /></label><label className="field">起床時間<input type="time" name="endTime" required defaultValue={modal.record?.endAt.slice(11, 16) ?? '07:00'} /></label></div><p className="form-hint"><AlarmClock size={15} />跨日睡眠請選擇隔天的起床日期。</p><ModalActions onCancel={() => setModal(null)} /></form>}
      {modal.kind === 'task' && <form onSubmit={event => void submitTask(event)}><label className="field">任務名稱<input name="title" required maxLength={80} placeholder="例如：讀書、運動、整理房間" defaultValue={modal.record?.title ?? ''} autoFocus /></label><p className="field-caption">花費時間</p><div className="field-row duration-fields"><label className="field"><span className="sr-only">小時</span><input name="hours" type="number" min="0" max="99" placeholder="0" defaultValue={modal.record ? Math.floor(modal.record.durationMinutes / 60) : ''} /><em>小時</em></label><label className="field"><span className="sr-only">分鐘</span><input name="minutes" type="number" min="0" max="59" placeholder="30" defaultValue={modal.record ? modal.record.durationMinutes % 60 : ''} /><em>分鐘</em></label></div><p className="form-hint"><Clock3 size={15} />儲存後可以在清單中標記完成狀態。</p><ModalActions onCancel={() => setModal(null)} /></form>}
      {modal.kind === 'meal' && <form onSubmit={event => void submitMeal(event)}><label className="field">餐別<select name="type" defaultValue={modal.record?.type ?? modal.type ?? '早餐'}>{mealTypes.map(type => <option key={type}>{type}</option>)}</select></label><label className="field">吃了什麼？<textarea name="description" rows={3} maxLength={500} placeholder="簡單記一下餐點…" defaultValue={modal.record?.description ?? ''} /></label><label className="photo-upload"><ImagePlus size={19} /><span>{modal.record?.photo ? '更換照片' : '加入餐點照片'}</span><small>照片會縮小後存在本機</small><input name="photo" type="file" accept="image/*" capture="environment" /></label>{modal.record?.photo && <img className="photo-preview" src={modal.record.photo} alt="目前餐點照片" />}<ModalActions onCancel={() => setModal(null)} /></form>}
    </section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}

function ModalActions({ onCancel }: { onCancel: () => void }) {
  return <div className="modal-actions"><button className="cancel-button" type="button" onClick={onCancel}>取消</button><button className="action-button green-action" type="submit">儲存紀錄</button></div>
}
