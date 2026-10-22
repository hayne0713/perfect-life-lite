import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LifeRecords } from '../../data'
import { addDays, intervalTouchesDate, monthDays } from '../../shared/date'

type Props = { selectedDate: string; records: LifeRecords; onSelect: (date: string) => void }
const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

export function CalendarPanel({ selectedDate, records, onSelect }: Props) {
  const [month, setMonth] = useState(() => new Date(`${selectedDate}T12:00:00`))
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const days = useMemo(() => monthDays(year, monthIndex), [year, monthIndex])
  const today = new Date()

  useEffect(() => {
    const selected = new Date(`${selectedDate}T12:00:00`)
    setMonth(current => current.getFullYear() === selected.getFullYear() && current.getMonth() === selected.getMonth()
      ? current
      : new Date(selected.getFullYear(), selected.getMonth(), 1))
  }, [selectedDate])

  function moveMonth(amount: number) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  function selectToday() {
    const date = addDays(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`, 0)
    setMonth(new Date(`${date}T12:00:00`))
    onSelect(date)
  }

  const monthLabel = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long' }).format(month)

  return <section className="calendar-card" aria-label="日曆">
    <div className="calendar-heading">
      <div className="section-title"><span className="section-icon calendar-icon"><CalendarDays size={18} /></span><div><p className="eyebrow">LIFE CALENDAR</p><h2>生活日曆</h2></div></div>
      <button className="today-button" onClick={selectToday}>今天</button>
    </div>
    <div className="month-navigation">
      <button className="icon-button" aria-label="上個月" onClick={() => moveMonth(-1)}><ChevronLeft size={19} /></button>
      <strong>{monthLabel}</strong>
      <button className="icon-button" aria-label="下個月" onClick={() => moveMonth(1)}><ChevronRight size={19} /></button>
    </div>
    <div className="calendar-grid calendar-weekdays">{weekdayLabels.map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid calendar-days">
      {days.map(({ date, inMonth }) => {
        const hasActivity = records.activities.some(item => intervalTouchesDate(item.startAt, item.endAt, date))
        const hasSleep = records.sleep.some(item => intervalTouchesDate(item.startAt, item.endAt, date))
        const hasMeal = records.meals.some(item => item.date === date)
        const hasTask = records.tasks.some(item => item.date === date)
        const marks = [hasActivity && 'activity-mark', hasSleep && 'sleep-mark', hasMeal && 'meal-mark', hasTask && 'reminder-mark'].filter(Boolean)
        const dayNumber = Number(date.slice(-2))
        const isToday = date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        return <button key={date} className={`calendar-day ${inMonth ? '' : 'outside-month'} ${selectedDate === date ? 'selected-day' : ''} ${isToday ? 'is-today' : ''}`} onClick={() => onSelect(date)} aria-pressed={selectedDate === date}>
          <span className="day-number">{dayNumber}</span>
          <span className="day-marks" aria-hidden="true">{marks.map((mark, index) => <i key={`${date}-${index}`} className={String(mark)} />)}</span>
          <span className="sr-only">{[hasActivity && '活動', hasSleep && '睡眠', hasMeal && '飲食', hasTask && '提醒'].filter(Boolean).join('、')}</span>
        </button>
      })}
    </div>
    <div className="calendar-legend"><span><i className="activity-mark" />活動</span><span><i className="sleep-mark" />睡眠</span><span><i className="meal-mark" />飲食</span><span><i className="reminder-mark" />提醒</span></div>
  </section>
}
