import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { useHabitStore } from '../stores/habitStore'
import { formatDate } from '../utils/date'
import type { BowelLog } from '../db'

const bristolTypes = [
  { value: 1, emoji: '🪨', label: '硬球', color: '#8B6914' },
  { value: 2, emoji: '🪨', label: '硬块', color: '#A0845C' },
  { value: 3, emoji: '🌰', label: '有裂', color: '#C4A46C' },
  { value: 4, emoji: '🍌', label: '理想', color: '#9CAF88' },
  { value: 5, emoji: '💧', label: '软团', color: '#C8956C' },
  { value: 6, emoji: '💧', label: '糊状', color: '#D4A574' },
  { value: 7, emoji: '🌊', label: '水样', color: '#C9807A' },
]

export default function BowelDetailPage() {
  const navigate = useNavigate()
  const { bowelLogsAll, loadAllBowelLogs, bowelLogs, loadBowelLogs } = useHabitStore()

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)

  useEffect(() => {
    loadAllBowelLogs()
    loadBowelLogs(365)
  }, [])

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

  function getLogForDate(ds: string): BowelLog | undefined {
    return bowelLogsAll.find((l) => {
      const ld = new Date(l.datetime).toISOString().slice(0, 10)
      return ld === ds
    })
  }

  // Stats
  const monthLogs = bowelLogsAll.filter((l) => {
    const d = new Date(l.datetime)
    return d.getFullYear() === viewYear && d.getMonth() + 1 === viewMonth
  })
  const avgEase = monthLogs.length > 0
    ? Math.round((monthLogs.reduce((s, l) => s + l.ease, 0) / monthLogs.length) * 10) / 10
    : null
  const typeCounts: Record<number, number> = {}
  monthLogs.forEach((l) => { typeCounts[l.bristolType] = (typeCounts[l.bristolType] || 0) + 1 })
  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]

  const dayHeaders = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={22} className="text-text-muted" />
        </button>
        <h1 className="text-2xl font-medium text-text">排便记录</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl p-3 text-center">
          <p className="text-lg font-medium text-text tnum">{monthLogs.length}</p>
          <p className="text-[10px] text-text-muted">本月记录</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center">
          <p className="text-lg font-medium text-text tnum">{avgEase ?? '-'}</p>
          <p className="text-[10px] text-text-muted">平均顺畅度</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center">
          {mostCommonType ? (
            <p className="text-lg">{bristolTypes.find((t) => t.value === Number(mostCommonType[0]))?.emoji}</p>
          ) : (
            <p className="text-lg text-text-muted">-</p>
          )}
          <p className="text-[10px] text-text-muted">最常见</p>
        </div>
      </div>

      {/* Type distribution */}
      {monthLogs.length > 0 && (
        <div className="bg-card rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-accent" />
            <h2 className="text-sm font-medium text-text">本月形态分布</h2>
          </div>
          <div className="space-y-1.5">
            {bristolTypes.map((bt) => {
              const count = typeCounts[bt.value] || 0
              const pct = monthLogs.length > 0 ? Math.round((count / monthLogs.length) * 100) : 0
              return (
                <div key={bt.value} className="flex items-center gap-2">
                  <span className="text-sm w-6">{bt.emoji}</span>
                  <span className="text-[10px] text-text-muted w-8">{bt.label}</span>
                  <div className="flex-1 h-3 bg-border/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: bt.color }} />
                  </div>
                  <span className="text-[10px] text-text-muted w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Month Calendar */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">月历</h2>
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
              const log = getLogForDate(ds)
              const bt = log ? bristolTypes.find((t) => t.value === log.bristolType) : null
              const isToday = ds === new Date().toISOString().slice(0, 10)
              return (
                <div key={ds} className="aspect-square flex flex-col items-center justify-center">
                  <span className={`text-xs ${isToday ? 'text-accent font-medium' : 'text-text'}`}>{day}</span>
                  {bt ? (
                    <span className="text-sm">{bt.emoji}</span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-border/50 mt-1" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recent log list */}
      <section>
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">最近记录</h2>
        {bowelLogs.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">暂无记录</p>
        ) : (
          <div className="space-y-2">
            {bowelLogs.slice(0, 20).map((log) => {
              const bt = bristolTypes.find((t) => t.value === log.bristolType)
              return (
                <div key={log.id} className="bg-card rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{bt?.emoji || '❓'}</span>
                  <div className="flex-1">
                    <p className="text-sm text-text">{bt?.label || '-'}</p>
                    <p className="text-xs text-text-muted">
                      {formatDate(new Date(log.datetime).toISOString().slice(0, 10))} · 顺畅度 {'⭐'.repeat(log.ease)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
