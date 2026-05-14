import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Clock, ChevronRight, Plus, Flame, Leaf, ShoppingBag } from 'lucide-react'
import { useReminderStore } from '../stores/reminderStore'
import { useHabitStore } from '../stores/habitStore'
import { useBeautyStore } from '../stores/beautyStore'
import { useCreditStore } from '../stores/creditStore'
import { useCultivationStore } from '../stores/cultivationStore'
import { getDailyQuote } from '../utils/philosophy'
import { getAllAlerts } from '../utils/alerts'
import { getLevelEmoji, getLevelColor } from '../utils/credits'
import { cultivationCards } from '../utils/cultivationCards'
import AlertBanner from '../components/features/AlertBanner'
import CelebrationModal from '../components/features/CelebrationModal'
import CreditBadge from '../components/features/CreditBadge'
import SpendCreditModal from '../components/features/SpendCreditModal'
import CultivationCardStack from '../components/features/CultivationCardStack'
import { today, formatDate, weekLabel } from '../utils/date'

export default function HomePage() {
  const navigate = useNavigate()
  const reminders = useReminderStore((s) => s.reminders)
  const todayLogs = useReminderStore((s) => s.todayLogs)
  const completeReminder = useReminderStore((s) => s.completeReminder)
  const habits = useHabitStore((s) => s.habits)
  const todayHabitLogs = useHabitStore((s) => s.todayHabitLogs)
  const toggleHabit = useHabitStore((s) => s.toggleHabit)
  const loadTodayHabitLogs = useHabitStore((s) => s.loadTodayHabitLogs)
  const loadTodayLogs = useReminderStore((s) => s.loadTodayLogs)

  const bowelLogs = useHabitStore((s) => s.bowelLogs)
  const weightLogs = useBeautyStore((s) => s.weightLogs)
  const loadBowelLogs = useHabitStore((s) => s.loadBowelLogs)
  const loadWeightLogs = useBeautyStore((s) => s.loadWeightLogs)

  // Credit store
  const creditBalance = useCreditStore((s) => s.balance)
  const loadCreditLogs = useCreditStore((s) => s.loadCreditLogs)
  const earnCredits = useCreditStore((s) => s.earnCredits)
  const getCreditStatus = useCreditStore((s) => s.getStatus)

  // Cultivation store
  const cultivationEnabledIds = useCultivationStore((s) => s.enabledIds)
  const cultivationTodayLogs = useCultivationStore((s) => s.todayLogs)
  const loadEnabledCards = useCultivationStore((s) => s.loadEnabledCards)
  const loadCultivationLogs = useCultivationStore((s) => s.loadTodayLogs)
  const completeCard = useCultivationStore((s) => s.completeCard)
  const skipCard = useCultivationStore((s) => s.skipCard)

  const enabledCards = useMemo(
    () => cultivationCards.filter((c) => cultivationEnabledIds.includes(c.id)),
    [cultivationEnabledIds]
  )
  const doneCardIds = useMemo(
    () => new Set(cultivationTodayLogs.map((l) => l.cardId)),
    [cultivationTodayLogs]
  )
  const remainingCards = useMemo(
    () => enabledCards.filter((c) => !doneCardIds.has(c.id)),
    [enabledCards, doneCardIds]
  )
  const allCardsDone = remainingCards.length === 0 && cultivationTodayLogs.length >= enabledCards.length

  const [quote] = useState(getDailyQuote)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [celebrate, setCelebrate] = useState(false)
  const [showCreditDetail, setShowCreditDetail] = useState(false)
  const [showSpendCredit, setShowSpendCredit] = useState(false)

  useEffect(() => {
    loadTodayLogs()
    loadTodayHabitLogs()
    loadBowelLogs(14)
    loadWeightLogs(14)
    loadCreditLogs()
    loadEnabledCards()
    loadCultivationLogs()
    const i = setInterval(() => {
      loadTodayLogs()
      loadTodayHabitLogs()
    }, 60000)
    return () => clearInterval(i)
  }, [])

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Active reminders (near or past time today)
  const activeItems = reminders
    .filter((r) => r.enabled)
    .flatMap((r) =>
      r.times.map((t) => {
        const [h, m] = t.split(':').map(Number)
        const schedMin = h * 60 + m
        const schedAt = new Date()
        schedAt.setHours(h, m, 0, 0)
        const log = todayLogs.find(
          (l) => l.reminderId === r.id && l.scheduledAt === schedAt.getTime()
        )
        const isDone = log?.completedAt != null
        const isSkipped = log?.skipped
        return { reminder: r, time: t, schedMin, schedAt, isDone, isSkipped }
      })
    )
    .filter((item) => !item.isDone && !item.isSkipped)
    .sort((a, b) => {
      // Overdue first, then upcoming
      const aOverdue = a.schedMin < currentMinutes ? 0 : 1
      const bOverdue = b.schedMin < currentMinutes ? 0 : 1
      if (aOverdue !== bOverdue) return aOverdue - bOverdue
      return a.schedMin - b.schedMin
    })

  const doneCount = habits.filter((h) =>
    todayHabitLogs.some((l) => l.habitId === h.id && l.date === today() && l.completed)
  ).length

  // Alerts
  const alerts = useMemo(() => {
    return getAllAlerts(habits, todayHabitLogs, bowelLogs, weightLogs, reminders, todayLogs)
      .filter((a) => !dismissed.has(a.id))
  }, [habits, todayHabitLogs, bowelLogs, weightLogs, reminders, todayLogs, dismissed])

  function dismissAlert(id: string) {
    setDismissed((prev) => new Set([...prev, id]))
  }

  async function handleToggleHabit(habitId: number) {
    await toggleHabit(habitId)
    // Check if this completed the habit (not undoing)
    const habit = habits.find((h) => h.id === habitId)
    const wasDone = todayHabitLogs.some(
      (l) => l.habitId === habitId && l.date === today() && l.completed
    )
    if (!wasDone && habit) {
      await earnCredits(`完成「${habit.name}」`)
    }
    const allDone = habits.length > 0 && habits.every((h) => {
      if (h.id === habitId) return true // just toggled
      return todayHabitLogs.some((l) => l.habitId === h.id && l.date === today() && l.completed)
    })
    if (allDone) setCelebrate(true)
  }

  return (
    <div className="px-5 pt-12 pb-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <p className="text-text-muted text-sm">
            {formatDate(today())} {weekLabel(today())}
          </p>
          <CreditBadge onClick={() => setShowCreditDetail(true)} />
        </div>
        <h1 className="text-2xl font-medium text-text tracking-wide">本真</h1>
      </div>

      {/* Quote */}
      <div className="mb-4 px-1">
        <p className="text-text-muted text-[15px] leading-relaxed italic">
          「{quote}」
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-5">
          <AlertBanner alerts={alerts} onDismiss={dismissAlert} />
        </div>
      )}

      {/* Reminders Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
            今日提醒
          </h2>
          <button
            onClick={() => navigate('/reminders')}
            className="text-text-muted p-1"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {activeItems.length === 0 ? (
          <div className="bg-card rounded-xl p-5 text-center">
            <Bell size={28} className="text-border mx-auto mb-2" />
            <p className="text-text-muted text-sm">今天没有待办的提醒</p>
            <button
              onClick={() => navigate('/reminders')}
              className="mt-2 text-accent text-sm"
            >
              + 添加提醒
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeItems.slice(0, 3).map((item) => (
              <div
                key={`${item.reminder.id}-${item.time}`}
                className="bg-card rounded-xl p-4 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.schedMin < currentMinutes
                      ? 'bg-reminder/15'
                      : 'bg-border/50'
                  }`}
                >
                  {item.schedMin < currentMinutes ? (
                    <Bell size={18} className="text-reminder" />
                  ) : (
                    <Clock size={18} className="text-text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-text truncate">
                    {item.reminder.title}
                  </p>
                  <p className="text-xs text-text-muted">
                    {item.time}
                    {item.reminder.dosage ? ` · ${item.reminder.dosage}` : ''}
                    {item.schedMin < currentMinutes ? ' · 已过时' : ''}
                  </p>
                </div>
                <button
                  onClick={() =>
                    completeReminder(item.reminder.id!, item.schedAt.getTime())
                  }
                  className="bg-accent text-white text-sm px-3 py-1.5 rounded-lg flex-shrink-0"
                >
                  完成
                </button>
              </div>
            ))}
            {activeItems.length > 3 && (
              <button
                onClick={() => navigate('/reminders')}
                className="w-full text-text-muted text-sm py-2 text-center"
              >
                还有 {activeItems.length - 3} 项提醒 →
              </button>
            )}
          </div>
        )}
      </section>

      {/* Quick Bowel Entry */}
      <section className="mb-8">
        <button
          onClick={() => navigate('/habits?action=bowel')}
          className="w-full bg-card rounded-xl p-4 flex items-center gap-3 border border-border"
        >
          <div className="w-9 h-9 rounded-full bg-accent-warm/15 flex items-center justify-center">
            <Leaf size={18} className="text-accent-warm" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] text-text">记录排便</p>
            <p className="text-xs text-text-muted">快速记录今日排便状况</p>
          </div>
          <Plus size={20} className="text-text-muted" />
        </button>
      </section>

      {/* Daily Habits */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
            今日打卡
          </h2>
          <span className="text-xs text-text-muted">
            {doneCount}/{habits.length}
          </span>
        </div>

        {habits.length === 0 ? (
          <div className="bg-card rounded-xl p-5 text-center">
            <Check size={28} className="text-border mx-auto mb-2" />
            <p className="text-text-muted text-sm">还没有习惯，去设置你的第一个习惯吧</p>
            <button
              onClick={() => navigate('/settings')}
              className="mt-2 text-accent text-sm"
            >
              添加习惯
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => {
              const done = todayHabitLogs.some(
                (l) => l.habitId === habit.id && l.date === today() && l.completed
              )
              return (
                <button
                  key={habit.id}
                  onClick={() => handleToggleHabit(habit.id!)}
                  className={`w-full bg-card rounded-xl p-4 flex items-center gap-3 transition-all duration-200 ${
                    done ? 'opacity-60' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? 'bg-success/15' : 'bg-border/50'
                    }`}
                    style={!done ? { backgroundColor: habit.color + '20' } : {}}
                  >
                    {done ? (
                      <Check size={18} className="text-success" />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: habit.color }}
                      />
                    )}
                  </div>
                  <span className={`text-[15px] ${done ? 'text-text-muted line-through' : 'text-text'}`}>
                    {habit.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Cultivation Cards */}
      {enabledCards.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
              修炼卡片
            </h2>
            {allCardsDone && cultivationTodayLogs.length > 0 && (
              <span className="text-xs text-success">今日完成</span>
            )}
          </div>
          {allCardsDone && cultivationTodayLogs.length > 0 ? (
            <div className="bg-card rounded-xl p-5 text-center">
              <p className="text-[15px] text-text font-medium">今日修炼完成 ✨</p>
              <p className="text-xs text-text-muted mt-1">你已在存在的意义上，又精进了一步</p>
            </div>
          ) : (
            <CultivationCardStack
              cards={remainingCards}
              onComplete={async (cardId) => {
                await completeCard(cardId)
                await earnCredits(`修炼卡片「${enabledCards.find((c) => c.id === cardId)?.title || cardId}」`)
              }}
              onSkip={skipCard}
            />
          )}
        </section>
      )}

      {/* Indulgence button */}
      <section className="mb-8">
        <button
          onClick={() => setShowSpendCredit(true)}
          className="w-full bg-card rounded-xl p-4 flex items-center gap-3 border border-border/50"
        >
          <div className="w-9 h-9 rounded-full bg-accent-warm/10 flex items-center justify-center">
            <ShoppingBag size={18} className="text-accent-warm" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] text-text">记录放纵</p>
            <p className="text-xs text-text-muted">花掉自律余额，犒赏自己</p>
          </div>
          <span className="text-xs text-text-muted">余额 {creditBalance}</span>
        </button>
      </section>

      {/* Streak hint */}
      {doneCount > 0 && doneCount === habits.length && habits.length > 0 && (
        <div className="bg-accent/10 rounded-xl p-4 flex items-center gap-3">
          <Flame size={20} className="text-accent" />
          <p className="text-sm text-accent">
            今天的你全部完成了。安静地确认，你做到了。
          </p>
        </div>
      )}

      <CelebrationModal show={celebrate} onClose={() => setCelebrate(false)} />
      <SpendCreditModal show={showSpendCredit} onClose={() => setShowSpendCredit(false)} />

      {/* Credit Detail Modal */}
      {showCreditDetail && (() => {
        const status = getCreditStatus(habits.length)
        const creditLogs = useCreditStore.getState().creditLogs
        return (
          <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center" onClick={() => setShowCreditDetail(false)}>
            <div className="bg-card w-full max-w-[480px] rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-medium text-text">自律余额</h2>
                <button onClick={() => setShowCreditDetail(false)} className="p-1">
                  <span className="text-text-muted text-lg">✕</span>
                </button>
              </div>
              <div className="text-center mb-5">
                <span className="text-4xl">{getLevelEmoji(status.level)}</span>
                <p className="text-3xl font-medium text-text mt-2" style={{ color: getLevelColor(status.level) }}>{status.balance}</p>
                <p className="text-sm text-text-muted mt-1">{status.hint}</p>
              </div>
              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-success/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-text-muted">已挣取</p>
                  <p className="text-lg font-medium text-success">+{status.earned}</p>
                </div>
                <div className="flex-1 bg-accent-warm/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-text-muted">已消耗</p>
                  <p className="text-lg font-medium text-accent-warm">-{status.spent}</p>
                </div>
                <div className="flex-1 bg-border/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-text-muted">满分</p>
                  <p className="text-lg font-medium text-text">{status.maxPossible}</p>
                </div>
              </div>
              {creditLogs.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  <p className="text-xs text-text-muted mb-2">近7天记录</p>
                  {creditLogs.slice().reverse().map((log, i) => (
                    <div key={log.id || i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-border/10">
                      <span className="text-sm text-text truncate flex-1">{log.reason}</span>
                      <span className={`text-sm font-medium ml-2 ${log.amount > 0 ? 'text-success' : 'text-accent-warm'}`}>
                        {log.amount > 0 ? '+' : ''}{log.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => { setShowCreditDetail(false); setShowSpendCredit(true) }}
                className="w-full bg-accent-warm text-white py-3 rounded-xl text-[15px] font-medium mt-4"
              >
                记录放纵
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
