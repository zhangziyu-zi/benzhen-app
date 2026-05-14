import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowLeft, Flame, Calendar, Target } from 'lucide-react'
import { useHabitStore } from '../stores/habitStore'

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { habits, monthHabitLogs, loadHabits, loadHabitLogsForRange, getHabitStats } = useHabitStore()

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [stats, setStats] = useState<{ total: number; streak: number; monthRate: number } | null>(null)

  const habitId = Number(id)
  const habit = habits.find((h) => h.id === habitId)

  useEffect(() => {
    loadHabits()
  }, [])

  useEffect(() => {
    if (!habitId) return
    loadMonthData(viewYear, viewMonth)
    getHabitStats(habitId).then(setStats)
  }, [habitId, viewYear, viewMonth])

  async function loadMonthData(y: number, m: number) {
    const ym = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`
    const lastDay = new Date(y, m, 0).getDate()
    await loadHabitLogsForRange(`${ym}-01`, `${ym}-${String(lastDay).padStart(2, '0')}`)
  }

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1) }
    else setViewMonth(viewMonth + 1)
  }

  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(day: number) {
    return `${String(viewYear).padStart(4, '0')}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  if (!habit) {
    return (
      <div className="px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-4">
          <ArrowLeft size={18} /> <span className="text-sm">返回</span>
        </button>
        <p className="text-text-muted text-sm">习惯不存在或已被删除</p>
      </div>
    )
  }

  const dayHeaders = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="px-5 pt-12 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={22} className="text-text-muted" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm" style={{ backgroundColor: habit.color }} />
          <h1 className="text-2xl font-medium text-text">{habit.name}</h1>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl p-3 text-center">
            <Target size={16} className="text-accent mx-auto mb-1" />
            <p className="text-lg font-medium text-text tnum">{stats.total}</p>
            <p className="text-[10px] text-text-muted">总打卡</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center">
            <Flame size={16} className="text-reminder mx-auto mb-1" />
            <p className="text-lg font-medium text-text tnum">{stats.streak}</p>
            <p className="text-[10px] text-text-muted">连续天</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center">
            <Calendar size={16} className="text-accent-warm mx-auto mb-1" />
            <p className="text-lg font-medium text-text tnum">{stats.monthRate}%</p>
            <p className="text-[10px] text-text-muted">本月打卡率</p>
          </div>
        </div>
      )}

      {/* Month Calendar Heatmap */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">历史记录</h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1"><ChevronLeft size={18} className="text-text-muted" /></button>
            <span className="text-sm text-text min-w-[80px] text-center">{viewYear}年{viewMonth}月</span>
            <button onClick={nextMonth} className="p-1"><ChevronRight size={18} className="text-text-muted" /></button>
          </div>
        </div>

        <div className="bg-card rounded-xl p-3">
          <div className="grid grid-cols-7 mb-2">
            {dayHeaders.map((d, i) => (
              <div key={i} className="text-center text-[11px] text-text-muted py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} className="aspect-square" />
              const ds = dateStr(day)
              const done = monthHabitLogs.some(
                (l) => l.habitId === habitId && l.date === ds && l.completed
              )
              const isToday = ds === new Date().toISOString().slice(0, 10)
              return (
                <div key={ds} className="aspect-square flex items-center justify-center">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                      done
                        ? 'text-white'
                        : isToday
                        ? 'text-text border border-border'
                        : 'text-text-muted'
                    }`}
                    style={done ? { backgroundColor: habit.color } : {}}
                  >
                    {day}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: habit.color }} /> 已完成
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-border" /> 未完成
          </div>
        </div>
      </section>
    </div>
  )
}
