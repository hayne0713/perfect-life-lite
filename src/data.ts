import { DBSchema, IDBPDatabase, openDB } from 'idb'

export type SleepRecord = { id: string; startAt: string; endAt: string; updatedAt: string }
export type TaskRecord = { id: string; date: string; title: string; durationMinutes: number; completed: boolean; createdAt: string }
export type MealType = '早餐' | '午餐' | '晚餐' | '其他'
export type MealRecord = { id: string; date: string; type: MealType; description: string; photo?: string; createdAt: string }

interface LifeDB extends DBSchema {
  sleep: { key: string; value: SleepRecord; indexes: { 'by-start': string } }
  tasks: { key: string; value: TaskRecord; indexes: { 'by-date': string } }
  meals: { key: string; value: MealRecord; indexes: { 'by-date': string } }
}

let dbPromise: Promise<IDBPDatabase<LifeDB>> | undefined
export function getDb() {
  dbPromise ??= openDB<LifeDB>('perfect-life-lite', 1, {
    upgrade(db) {
      const sleep = db.createObjectStore('sleep', { keyPath: 'id' })
      sleep.createIndex('by-start', 'startAt')
      const tasks = db.createObjectStore('tasks', { keyPath: 'id' })
      tasks.createIndex('by-date', 'date')
      const meals = db.createObjectStore('meals', { keyPath: 'id' })
      meals.createIndex('by-date', 'date')
    },
  })
  return dbPromise
}

export const localDate = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function localDateTime(date: string, time: string) { return `${date}T${time}` }
export function makeId() { return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}` }
export function sleepMinutes(record?: SleepRecord) {
  if (!record) return 0
  return Math.max(0, Math.round((new Date(record.endAt).getTime() - new Date(record.startAt).getTime()) / 60000))
}
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} 小時${mins ? ` ${mins} 分` : ''}`
}
export function formatTime(dateTime: string) {
  const date = new Date(dateTime)
  return new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

export type BackupData = {
  app: 'Perfect Life Lite'
  version: 1
  exportedAt: string
  sleep: SleepRecord[]
  tasks: TaskRecord[]
  meals: MealRecord[]
}

export async function exportAll(): Promise<BackupData> {
  const db = await getDb()
  const [sleep, tasks, meals] = await Promise.all([
    db.getAll('sleep'), db.getAll('tasks'), db.getAll('meals'),
  ])
  return { app: 'Perfect Life Lite', version: 1, exportedAt: new Date().toISOString(), sleep, tasks, meals }
}

function isBackup(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<BackupData>
  return data.app === 'Perfect Life Lite' && data.version === 1 &&
    Array.isArray(data.sleep) && Array.isArray(data.tasks) && Array.isArray(data.meals) &&
    data.sleep.every(x => x && typeof x.id === 'string' && typeof x.startAt === 'string' && typeof x.endAt === 'string') &&
    data.tasks.every(x => x && typeof x.id === 'string' && typeof x.date === 'string' && typeof x.title === 'string' && typeof x.durationMinutes === 'number' && typeof x.completed === 'boolean') &&
    data.meals.every(x => x && typeof x.id === 'string' && typeof x.date === 'string' && typeof x.description === 'string' && ['早餐', '午餐', '晚餐', '其他'].includes(x.type))
}

export async function importAll(value: unknown) {
  if (!isBackup(value)) throw new Error('備份檔格式不正確或版本不支援。')
  const db = await getDb()
  const tx = db.transaction(['sleep', 'tasks', 'meals'], 'readwrite')
  await Promise.all([
    tx.objectStore('sleep').clear(), tx.objectStore('tasks').clear(), tx.objectStore('meals').clear(),
  ])
  await Promise.all([
    ...value.sleep.map(record => tx.objectStore('sleep').put(record)),
    ...value.tasks.map(record => tx.objectStore('tasks').put(record)),
    ...value.meals.map(record => tx.objectStore('meals').put(record)),
  ])
  await tx.done
}
