import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, X, ChevronLeft, ChevronRight, Leaf } from 'lucide-react'
import { useHabitStore } from '../stores/habitStore'
import { useCreditStore } from '../stores/creditStore'
import { today, formatDate } from '../utils/date'
import db from '../db'

const bristolTypes = [
  { value: 1, emoji: '🪨', label: '硬球状' },
  { value: 2, emoji: '🪨', label: '条状硬块' },
  { value: 3, emoji: '🌰', label: '条状有裂' },
  { value: 4, emoji: '🍌', label: '光滑柔软' },
  { value: 5, emoji: '💧', label: '软团状' },
  { value: 6, emoji: '💧', label: '糊状' },
  { value: 7, emoji: '🌊', label: '水样' },
]

const DAY_HEADERS = ['日', '一', '二', '三', '四', '五', '六']

export default function HabitsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    habits, todayHabitLogs, monthHabitLogs, bowelLogs,
    loadHabits, loadTodayHabitLogs, loadHabitLogsForRange, loadBowelLogs,
    toggleHabit, isHabitDoneInMonth, addBowelLog,
  } = useHabitStore()
  const earnCredits = useCreditStore((s) => s.earnCredits)

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1) // 1-12
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showBowel, setShowBowel] = useState(false)
  const [bowelType, setBowelType] = useState(4)
  const [bowelEase, setBowelEase] = useState(3)
  const [bowelNote, setBowelNote] = useState('')
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => { loadHabits(); loadTodayHabitLogs(); loadBowelLogs(30) }, [])
  useEffect(() => {
    const y = String(viewYear).padStart(4, '0')
    const m = String(viewMonth).padStart(2, '0')
    const from = `${y}-${m}-01`
    const lastDay = new Date(viewYear, viewMonth, 0).getDate()
    const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    loadHabitLogsForRange(from, to)
  }, [viewYear, viewMonth])

  useEffect(() => {
    if (searchParams.get('action') === 'bowel') {
      setShowBowel(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  const todayStr = today()

  // Build month calendar grid
  const monthGrid = useCallback(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay() // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  function dayToStr(day: number) {
    const y = String(viewYear).padStart(4, '0')
    const m = String(viewMonth).padStart(2, '0')
    return `${y}-${m}-${String(day).padStart(2, '0')}`
  }

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12) }
    else setViewMonth(viewMonth - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1) }
    else setViewMonth(viewMonth + 1)
    setSelectedDay(null)
  }

  const doneCount = habits.filter((h) =>
    todayHabitLogs.some((l) => l.habitId === h.id && l.date === todayStr && l.completed)
  ).length

  async function saveBowel() {
    await addBowelLog({ datetime: Date.now(), bristolType: bowelType, ease: bowelEase, note: bowelNote || undefined })
    setShowBowel(false); setBowelType(4); setBowelEase(3); setBowelNote('')
  }

  async function handleToggleHabit(habitId: number) {
    const habit = habits.find((h) => h.id === habitId)
    const wasDone = todayHabitLogs.some(
      (l) => l.habitId === habitId && l.date === todayStr && l.completed
    )
    await toggleHabit(habitId)
    // Earn credit on completion (not undo)
    if (!wasDone && habit) {
      await earnCredits(`完成「${habit.name}」`)
    }
    // Check all done for celebration
    const logs = await db.habitLogs.where({ date: todayStr, completed: true }).toArray()
    const allDone = habits.length > 0 && habits.every((h) => logs.some((l) => l.habitId === h.id))
    if (allDone) setCelebrate(true)
  }

  const cells = monthGrid()

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-text">打卡</h1>
        <button onClick={() => setShowBowel(true)} className="w-9 h-9 rounded-full bg-accent-warm text-white flex items-center justify-center">
          <Leaf size={18} />
        </button>
      </div>

      {/* Today's habits - quick list */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">今日习惯</h2>
          <span className="text-xs text-text-muted">{doneCount}/{habits.length}</span>
        </div>
        {habits.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">去设置页添加你的第一个习惯</p>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => {
              const done = todayHabitLogs.some((l) => l.habitId === habit.id && l.date === todayStr && l.completed)
              return (
                <div key={habit.id} className="bg-card rounded-xl p-4 flex items-center gap-3">
                  <button
                    onClick={() => handleToggleHabit(habit.id!)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done ? 'bg-success/15' : ''
                    }`}
                    style={!done ? { backgroundColor: habit.color + '20' } : {}}
                  >
                    {done ? <Check size={20} className="text-success" /> : <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: habit.color }} />}
                  </button>
                  <button onClick={() => navigate(`/habits/${habit.id}`)} className="flex-1 text-left">
                    <span className={`text-[15px] ${done ? 'text-text-muted line-through' : 'text-text'}`}>{habit.name}</span>
                  </button>
                  <span className="text-[10px] text-text-muted">→</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Month Calendar */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">月历</h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1"><ChevronLeft size={18} className="text-text-muted" /></button>
            <span className="text-[15px] text-text font-medium min-w-[90px] text-center">
              {viewYear}年{viewMonth}月
            </span>
            <button onClick={nextMonth} className="p-1"><ChevronRight size={18} className="text-text-muted" /></button>
          </div>
        </div>

        <div className="bg-card rounded-xl p-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_HEADERS.map((d, i) => (
              <div key={i} className="text-center text-[11px] text-text-muted py-1">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />
              const dateStr = dayToStr(day)
              const isToday = dateStr === todayStr
              const completedHabits = habits.filter((h) => isHabitDoneInMonth(h.id!, dateStr))
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(selectedDay === dateStr ? null : dateStr)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                    isToday ? 'ring-1 ring-accent' : ''
                  } ${selectedDay === dateStr ? 'bg-accent/10' : ''}`}
                >
                  <span className={`text-xs ${isToday ? 'text-accent font-medium' : 'text-text'}`}>{day}</span>
                  {completedHabits.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[90%]">
                      {completedHabits.slice(0, 3).map((h) => (
                        <span key={h.id} className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                      ))}
                      {completedHabits.length > 3 && (
                        <span className="text-[8px] text-text-muted">+{completedHabits.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div className="bg-card rounded-xl p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text">{formatDate(selectedDay)}</p>
              <button onClick={() => setSelectedDay(null)} className="p-0.5"><X size={16} className="text-text-muted" /></button>
            </div>
            {habits.map((habit) => {
              const done = isHabitDoneInMonth(habit.id!, selectedDay!)
              return (
                <div key={habit.id} className="flex items-center gap-2 py-1.5">
                  <div className={`w-2 h-2 rounded-full ${done ? '' : 'bg-border'}`}
                    style={done ? { backgroundColor: habit.color } : {}} />
                  <span className={`text-sm ${done ? 'text-text' : 'text-text-muted'}`}>
                    {habit.name} {done ? '✓' : '—'}
                  </span>
                </div>
              )
            })}
            {habits.length === 0 && <p className="text-text-muted text-sm">暂无习惯</p>}
          </div>
        )}
      </section>

      {/* Bowel history - click to detail */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">排便记录</h2>
          <button onClick={() => navigate('/habits/bowel')} className="text-xs text-accent">查看全部 →</button>
        </div>
        {bowelLogs.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">暂无记录，点击右上角叶子图标记录</p>
        ) : (
          <div className="space-y-2">
            {bowelLogs.slice(0, 5).map((log) => {
              const bt = bristolTypes.find((t) => t.value === log.bristolType)
              return (
                <button key={log.id} onClick={() => navigate('/habits/bowel')} className="w-full bg-card rounded-xl p-3 flex items-center gap-3 text-left">
                  <span className="text-2xl">{bt?.emoji || '❓'}</span>
                  <div className="flex-1">
                    <p className="text-sm text-text">{bt?.label || `类型${log.bristolType}`}</p>
                    <p className="text-xs text-text-muted">
                      {formatDate(new Date(log.datetime).toISOString().slice(0, 10))}{' '}
                      {new Date(log.datetime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}顺畅度 {'⭐'.repeat(log.ease)}
                    </p>
                  </div>
                  <span className="text-[10px] text-text-muted">→</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Celebration on all done */}
      {celebrate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={() => setCelebrate(false)}>
          <div className="bg-card rounded-2xl p-6 mx-5 max-w-sm text-center shadow-lg" onClick={(e) => e.stopPropagation()}>
            <p className="text-3xl mb-2">✨</p>
            <p className="text-lg font-medium text-text mb-1">全部完成</p>
            <p className="text-sm text-text-muted">今天的每一项都做得很好。你正在成为你想成为的样子。</p>
            <p className="text-xs text-success mt-2">+{habits.length} 自律余额已到账</p>
            <button onClick={() => setCelebrate(false)} className="mt-3 text-sm text-accent">继续</button>
          </div>
        </div>
      )}

      {/* Bowel Modal */}
      {showBowel && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
          <div className="bg-card w-full max-w-[480px] rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-text">记录排便</h2>
              <button onClick={() => setShowBowel(false)} className="p-1"><X size={22} className="text-text-muted" /></button>
            </div>
            <div className="mb-5">
              <label className="text-xs text-text-muted mb-2 block">形态</label>
              <div className="grid grid-cols-7 gap-1">
                {bristolTypes.map((t) => (
                  <button key={t.value} onClick={() => setBowelType(t.value)}
                    className={`flex flex-col items-center py-2 rounded-lg ${bowelType === t.value ? 'bg-accent/20 ring-1 ring-accent' : 'bg-border/30'}`}>
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-[9px] text-text-muted mt-0.5">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="text-xs text-text-muted mb-2 block">顺畅度</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} onClick={() => setBowelEase(v)}
                    className={`flex-1 py-2.5 rounded-lg text-lg ${bowelEase === v ? 'bg-accent-warm/20 ring-1 ring-accent-warm' : 'bg-border/30'}`}>
                    {v === 1 ? '😣' : v === 5 ? '😊' : '😐'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <input value={bowelNote} onChange={(e) => setBowelNote(e.target.value)} placeholder="备注（可选）"
                className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none" />
            </div>
            <button onClick={saveBowel} className="w-full bg-accent-warm text-white py-3 rounded-xl text-[15px] font-medium">保存记录</button>
          </div>
        </div>
      )}
    </div>
  )
}
