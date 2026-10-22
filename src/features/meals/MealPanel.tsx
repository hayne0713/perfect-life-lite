import { useMemo, useState, type FormEvent } from 'react'
import { Coffee, ImagePlus, Pencil, Plus, Sun, Trash2, Utensils } from 'lucide-react'
import { makeId, type MealRecord, type MealType } from '../../data'

type Props = { date: string; meals: MealRecord[]; onSave: (meal: MealRecord) => void; onDelete: (id: string) => void }
const mealTypes: MealType[] = ['早餐', '午餐', '晚餐', '其他']

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

export function MealPanel({ date, meals, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<MealRecord | 'new' | null>(null)
  const [error, setError] = useState('')
  const items = useMemo(() => meals.filter(meal => meal.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [meals, date])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const old = editing !== 'new' && editing ? editing : undefined
    const file = form.get('photo') as File | null
    let photo = old?.photo
    if (file?.size) {
      try { photo = await compressPhoto(file) } catch { setError('照片處理失敗，請換一張照片再試。'); return }
    }
    const now = new Date().toISOString()
    onSave({ id: old?.id ?? makeId(), date, type: String(form.get('type')) as MealType, description: String(form.get('description')).trim(), photo, createdAt: old?.createdAt ?? now })
    setEditing(null)
    setError('')
  }

  const iconFor = (type: MealType) => type === '早餐' ? <Coffee size={16} /> : type === '午餐' ? <Sun size={16} /> : <Utensils size={16} />

  return <section className="panel meal-panel">
    <div className="panel-heading"><div className="section-title"><span className="section-icon meal-icon"><Utensils size={18} /></span><div><p className="eyebrow">FOOD NOTES</p><h2>飲食紀錄</h2></div></div><button className="add-icon-button" aria-label="新增飲食紀錄" onClick={() => setEditing('new')}><Plus size={18} /></button></div>
    {items.length ? <div className="meal-list">{items.map(meal => <article className="meal-row" key={meal.id}><div className="meal-kind-icon">{iconFor(meal.type)}</div><div className="meal-content"><div className="meal-row-head"><strong>{meal.type}</strong><span>{new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(meal.createdAt))}</span></div>{meal.description && <p>{meal.description}</p>}{meal.photo && <img className="meal-photo" src={meal.photo} alt={`${meal.type}照片`} />}<div className="row-actions"><button aria-label="編輯飲食紀錄" onClick={() => setEditing(meal)}><Pencil size={15} /></button><button aria-label="刪除飲食紀錄" onClick={() => onDelete(meal.id)}><Trash2 size={15} /></button></div></div></article>)}</div> : <p className="empty-state">拍下或寫下今天吃了什麼。</p>}
    {editing && <div className="inline-editor"><div className="editor-heading"><strong>{editing === 'new' ? '新增飲食紀錄' : '編輯飲食紀錄'}</strong><button onClick={() => setEditing(null)}>取消</button></div><form onSubmit={event => void submit(event)}>
      <label className="field">餐別<select name="type" defaultValue={editing === 'new' ? '早餐' : editing.type}>{mealTypes.map(type => <option key={type}>{type}</option>)}</select></label>
      <label className="field">吃了什麼？<textarea name="description" rows={3} maxLength={500} defaultValue={editing === 'new' ? '' : editing.description} /></label>
      <label className="photo-upload"><ImagePlus size={18} /><span>{editing !== 'new' && editing.photo ? '更換照片' : '加入照片'}</span><input name="photo" type="file" accept="image/*" capture="environment" /></label>
      {editing !== 'new' && editing.photo && <img className="photo-preview" src={editing.photo} alt="餐點預覽" />}
      {error && <p className="inline-error">{error}</p>}<button className="start-button" type="submit">儲存飲食紀錄</button>
    </form></div>}
  </section>
}
