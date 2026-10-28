import { useMemo, useState, type FormEvent } from 'react'
import { Bell, Check, Circle, Pencil, Plus, Trash2 } from 'lucide-react'
import { makeId, type TaskRecord } from '../../data'

type Props = { date: string; today: string; tasks: TaskRecord[]; onSave: (task: TaskRecord) => void; onDelete: (id: string) => void }

export function ReminderPanel({ date, today, tasks, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<TaskRecord | 'new' | null>(null)
  const visible = useMemo(() => tasks.filter(task => task.date === date || (date === today && task.date < today && !task.completed)).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)), [tasks, date, today])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title')).trim()
    const dueDate = String(form.get('date'))
    if (!title || !dueDate) return
    const old = editing !== 'new' && editing ? editing : undefined
    const now = new Date().toISOString()
    onSave({ id: old?.id ?? makeId(), date: dueDate, title, durationMinutes: old?.durationMinutes, completed: old?.completed ?? false, createdAt: old?.createdAt ?? now, updatedAt: now })
    setEditing(null)
  }

  return <section className="panel reminder-panel">
    <div className="panel-heading"><div className="section-title"><span className="section-icon reminder-icon"><Bell size={18} /></span><div><p className="eyebrow">PLAN AHEAD</p><h2>{date === today ? '今天要記得' : '日期提醒'}</h2></div></div><button className="add-icon-button" aria-label="新增提醒" onClick={() => setEditing('new')}><Plus size={18} /></button></div>
    {visible.length ? <div className="reminder-list">{visible.map(task => <article className={`reminder-row ${task.completed ? 'reminder-done' : ''}`} key={task.id}>
      <button className="task-toggle" aria-label={task.completed ? '重新開啟提醒' : '完成提醒'} onClick={() => onSave({ ...task, completed: !task.completed, updatedAt: new Date().toISOString() })}>{task.completed ? <Check size={17} /> : <Circle size={18} />}</button>
      <button className="reminder-title" onClick={() => setEditing(task)}><span>{task.title}</span>{task.date < today && !task.completed && <small>逾期 · {task.date}</small>}</button>
      <div className="row-actions"><button aria-label="編輯提醒" onClick={() => setEditing(task)}><Pencil size={15} /></button><button aria-label="刪除提醒" onClick={() => onDelete(task.id)}><Trash2 size={15} /></button></div>
    </article>)}</div> : <p className="empty-state">沒有待辦提醒。想到要完成的事時，可以先記在這裡。</p>}
    {editing && <div className="inline-editor"><div className="editor-heading"><strong>{editing === 'new' ? '新增日期提醒' : '編輯提醒'}</strong><button onClick={() => setEditing(null)}>取消</button></div><form onSubmit={submit}>
      <label className="field">要完成什麼？<input name="title" required maxLength={120} autoFocus defaultValue={editing === 'new' ? '' : editing.title} /></label>
      <label className="field">提醒日期<input name="date" type="date" required defaultValue={editing === 'new' ? date : editing.date} /></label>
      <button className="start-button" type="submit">儲存提醒</button>
    </form></div>}
  </section>
}
