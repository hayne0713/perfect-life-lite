import { type DBSchema, type IDBPDatabase, type IDBPTransaction, openDB } from 'idb'
import { activityTotalsForDate, closeInterval, durationMs, intervalMinutesByDay } from './shared/time.js'
export { activityTotalsForDate, durationMs, intervalMinutesByDay }

export type SleepRecord = { id: string; startAt: string; endAt: string | null; updatedAt: string }
export type ActivitySession = { id: string; name: string; startAt: string; endAt: string | null; createdAt: string; updatedAt: string }
export type TaskRecord = { id: string; date: string; title: string; durationMinutes?: number; completed: boolean; createdAt: string; updatedAt?: string }
export type MealType = '早餐' | '午餐' | '晚餐' | '其他'
export type MealRecord = { id: string; date: string; type: MealType; description: string; photo?: string; createdAt: string }

interface LifeDB extends DBSchema {
  sleep: { key: string; value: SleepRecord; indexes: { 'by-start': string } }
  tasks: { key: string; value: TaskRecord; indexes: { 'by-date': string } }
  meals: { key: string; value: MealRecord; indexes: { 'by-date': string } }
  activities: { key: string; value: ActivitySession; indexes: { 'by-start': string } }
}

let dbPromise: Promise<IDBPDatabase<LifeDB>> | undefined

export function getDb() {
  dbPromise ??= openDB<LifeDB>('perfect-life-lite', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sleep')) {
        const sleep = db.createObjectStore('sleep', { keyPath: 'id' })
        sleep.createIndex('by-start', 'startAt')
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const tasks = db.createObjectStore('tasks', { keyPath: 'id' })
        tasks.createIndex('by-date', 'date')
      }
      if (!db.objectStoreNames.contains('meals')) {
        const meals = db.createObjectStore('meals', { keyPath: 'id' })
        meals.createIndex('by-date', 'date')
      }
      if (!db.objectStoreNames.contains('activities')) {
        const activities = db.createObjectStore('activities', { keyPath: 'id' })
        activities.createIndex('by-start', 'startAt')
      }
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

export const localDateTime = (date: string, time: string) => `${date}T${time}`
export const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const sleepMinutes = (record?: SleepRecord) => record?.endAt ? Math.round(durationMs(record.startAt, record.endAt) / 60000) : 0
export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours ? `${hours} 小時${mins ? ` ${mins} 分` : ''}` : `${mins} 分鐘`
}
export const formatTime = (dateTime: string) => new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(dateTime))

async function closeActiveIntervals(tx: IDBPTransaction<LifeDB, ('activities' | 'sleep')[], 'readwrite'>, at: string) {
  const [activities, sleeps] = await Promise.all([tx.objectStore('activities').getAll(), tx.objectStore('sleep').getAll()])
  const activeActivity = activities.find(item => !item.endAt)
  const activeSleep = sleeps.find(item => !item.endAt)
  if (activeActivity) await tx.objectStore('activities').put(closeInterval(activeActivity, at))
  if (activeSleep) await tx.objectStore('sleep').put(closeInterval(activeSleep, at))
}

export async function startActivity(name: string, at = new Date()) {
  const cleanName = name.trim()
  if (!cleanName) throw new Error('請先輸入活動名稱。')
  const db = await getDb()
  const timestamp = at.toISOString()
  const record: ActivitySession = { id: makeId(), name: cleanName, startAt: timestamp, endAt: null, createdAt: timestamp, updatedAt: timestamp }
  const tx = db.transaction(['activities', 'sleep'], 'readwrite')
  await closeActiveIntervals(tx, timestamp)
  await tx.objectStore('activities').put(record)
  await tx.done
  return record
}

export async function stopActivity(id: string, at = new Date()) {
  const db = await getDb()
  const record = await db.get('activities', id)
  if (!record || record.endAt) return
  const timestamp = at.toISOString()
  await db.put('activities', { ...record, endAt: timestamp, updatedAt: timestamp })
}

export async function startSleep(at = new Date()) {
  const db = await getDb()
  const timestamp = at.toISOString()
  const record: SleepRecord = { id: makeId(), startAt: timestamp, endAt: null, updatedAt: timestamp }
  const tx = db.transaction(['activities', 'sleep'], 'readwrite')
  const current = (await tx.objectStore('sleep').getAll()).find(item => !item.endAt)
  if (current) { await tx.done; return current }
  await closeActiveIntervals(tx, timestamp)
  await tx.objectStore('sleep').put(record)
  await tx.done
  return record
}

export async function stopSleep(at = new Date()) {
  const db = await getDb()
  const current = (await db.getAll('sleep')).find(item => !item.endAt)
  if (!current) return
  const timestamp = at.toISOString()
  await db.put('sleep', { ...current, endAt: timestamp, updatedAt: timestamp })
}

export async function saveActivity(record: ActivitySession) {
  const db = await getDb()
  await db.put('activities', { ...record, name: record.name.trim(), updatedAt: new Date().toISOString() })
}

export async function saveSleep(record: SleepRecord) {
  const db = await getDb()
  await db.put('sleep', { ...record, updatedAt: new Date().toISOString() })
}

export async function saveTask(record: TaskRecord) {
  const db = await getDb()
  await db.put('tasks', { ...record, title: record.title.trim(), updatedAt: new Date().toISOString() })
}

export async function saveMeal(record: MealRecord) {
  const db = await getDb()
  await db.put('meals', record)
}

export async function deleteRecord(store: 'sleep' | 'tasks' | 'meals' | 'activities', id: string) {
  const db = await getDb()
  await db.delete(store, id)
}

export type LifeRecords = { sleep: SleepRecord[]; tasks: TaskRecord[]; meals: MealRecord[]; activities: ActivitySession[] }
export async function loadAllRecords(): Promise<LifeRecords> {
  const db = await getDb()
  const [sleep, tasks, meals, activities] = await Promise.all([
    db.getAll('sleep'), db.getAll('tasks'), db.getAll('meals'), db.getAll('activities'),
  ])
  return { sleep, tasks, meals, activities }
}

export type BackupData = {
  app: 'Perfect Life Lite'
  version: 2
  exportedAt: string
  sleep: SleepRecord[]
  tasks: TaskRecord[]
  meals: MealRecord[]
  activities: ActivitySession[]
}

export async function exportAll(): Promise<BackupData> {
  const data = await loadAllRecords()
  return { app: 'Perfect Life Lite', version: 2, exportedAt: new Date().toISOString(), ...data }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidInterval(startAt: unknown, endAt: unknown) {
  if (typeof startAt !== 'string' || Number.isNaN(new Date(startAt).getTime())) return false
  if (endAt === null) return true
  return typeof endAt === 'string' && !Number.isNaN(new Date(endAt).getTime()) && new Date(endAt) > new Date(startAt)
}

function isLocalDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00`)
  return !Number.isNaN(parsed.getTime()) && localDate(parsed) === value
}

function isBackup(value: unknown): value is Record<string, unknown> & { version: 1 | 2; sleep: SleepRecord[]; tasks: TaskRecord[]; meals: MealRecord[]; activities?: ActivitySession[] } {
  if (!isObject(value) || value.app !== 'Perfect Life Lite' || (value.version !== 1 && value.version !== 2)) return false
  if (!Array.isArray(value.sleep) || !Array.isArray(value.tasks) || !Array.isArray(value.meals)) return false
  if (value.version === 2 && !Array.isArray(value.activities)) return false
  const validSleep = value.sleep.every(item => isObject(item) && typeof item.id === 'string' && isValidInterval(item.startAt, item.endAt) && typeof item.updatedAt === 'string')
  const validTasks = value.tasks.every(item => isObject(item) && typeof item.id === 'string' && isLocalDate(item.date) && typeof item.title === 'string' && typeof item.completed === 'boolean' && (item.durationMinutes === undefined || typeof item.durationMinutes === 'number'))
  const validMeals = value.meals.every(item => isObject(item) && typeof item.id === 'string' && isLocalDate(item.date) && ['早餐', '午餐', '晚餐', '其他'].includes(String(item.type)) && typeof item.description === 'string' && (item.photo === undefined || typeof item.photo === 'string'))
  const validActivities = value.version === 1 || (value.activities as unknown[]).every(item => isObject(item) && typeof item.id === 'string' && typeof item.name === 'string' && item.name.trim().length > 0 && isValidInterval(item.startAt, item.endAt) && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string')
  const activeCount = value.sleep.filter(item => isObject(item) && item.endAt === null).length + (value.version === 2 ? (value.activities as unknown[]).filter(item => isObject(item) && item.endAt === null).length : 0)
  return validSleep && validTasks && validMeals && validActivities && activeCount <= 1
}

export async function importAll(value: unknown) {
  if (!isBackup(value)) throw new Error('備份格式不正確或版本不支援，原有資料未變更。')
  const db = await getDb()
  const tx = db.transaction(['sleep', 'tasks', 'meals', 'activities'], 'readwrite')
  const activityRows = value.version === 2 ? value.activities ?? [] : []
  await Promise.all([
    tx.objectStore('sleep').clear(), tx.objectStore('tasks').clear(), tx.objectStore('meals').clear(), tx.objectStore('activities').clear(),
  ])
  await Promise.all([
    ...value.sleep.map(record => tx.objectStore('sleep').put(record)),
    ...value.tasks.map(record => tx.objectStore('tasks').put(record)),
    ...value.meals.map(record => tx.objectStore('meals').put(record)),
    ...activityRows.map(record => tx.objectStore('activities').put(record)),
  ])
  await tx.done
}
