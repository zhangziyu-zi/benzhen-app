import type { HabitLog, BowelLog, WeightLog, Reminder, ReminderLog } from '../db'
import { today } from './date'

export interface Alert {
  id: string
  type: 'warning' | 'danger'
  message: string
  icon: string
}

export function checkBowelsAlerts(bowelLogs: BowelLog[]): Alert[] {
  const alerts: Alert[] = []
  const now = Date.now()
  // Find consecutive days without bowel movement
  const dates = bowelLogs
    .map((l) => new Date(l.datetime).toISOString().slice(0, 10))
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort()
    .reverse()

  let missDays = 0
  const cur = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(cur)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    if (!dates.includes(ds)) {
      missDays++
    } else {
      break
    }
  }

  if (missDays >= 3) {
    alerts.push({
      id: 'bowel-danger',
      type: 'danger',
      message: `你已经 ${missDays} 天没有排便记录，请关注肠道健康`,
      icon: '🔥',
    })
  } else if (missDays >= 2) {
    alerts.push({
      id: 'bowel-warning',
      type: 'warning',
      message: `已经 ${missDays} 天无排便记录，多喝水、多吃纤维`,
      icon: '⚠️',
    })
  }
  return alerts
}

export function checkWeightAlerts(weightLogs: WeightLog[]): Alert[] {
  if (weightLogs.length < 3) return []
  const sorted = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0].weight

  // Check if weight hasn't moved in 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekDateStr = weekAgo.toISOString().slice(0, 10)
  const weekLogs = sorted.filter((l) => l.date >= weekDateStr)

  if (weekLogs.length >= 2) {
    const oldestWeight = weekLogs[weekLogs.length - 1].weight
    if (latest >= oldestWeight) {
      return [{
        id: 'weight-stall',
        type: 'warning',
        message: '体重已停滞 7 天没有下降趋势，检查饮食和运动',
        icon: '⚖️',
      }]
    }
  }
  return []
}

export function checkHabitAlerts(
  habits: { id?: number; name: string }[],
  habitLogs: HabitLog[]
): Alert[] {
  const alerts: Alert[] = []
  const todayStr = today()

  for (const habit of habits) {
    // Find last 3 days completions
    const last3: string[] = []
    const cur = new Date()
    for (let i = 0; i < 3; i++) {
      const d = new Date(cur)
      d.setDate(d.getDate() - i)
      last3.push(d.toISOString().slice(0, 10))
    }

    const hasCompletion = last3.some((ds) =>
      habitLogs.some(
        (l) => l.habitId === habit.id && l.date === ds && l.completed
      )
    )

    if (!hasCompletion && habit.id !== undefined) {
      alerts.push({
        id: `habit-${habit.id}`,
        type: 'warning',
        message: `「${habit.name}」已连续 3 天未打卡，小习惯容易被遗忘哦`,
        icon: '📋',
      })
    }
  }

  return alerts
}

export function checkReminderAlerts(
  reminders: Reminder[],
  todayLogs: ReminderLog[]
): Alert[] {
  const alerts: Alert[] = []
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const r of reminders) {
    if (!r.enabled) continue
    const allOverdue = r.times.every((t) => {
      const [h, m] = t.split(':').map(Number)
      const schedMin = h * 60 + m
      if (schedMin > currentMinutes) return false // not yet due
      const schedAt = new Date()
      schedAt.setHours(h, m, 0, 0)
      const log = todayLogs.find(
        (l) => l.reminderId === r.id && l.scheduledAt === schedAt.getTime()
      )
      return log?.completedAt == null // not completed
    })

    if (allOverdue && r.times.some((t) => {
      const [h, m] = t.split(':').map(Number)
      return (h * 60 + m) <= currentMinutes
    })) {
      alerts.push({
        id: `reminder-${r.id}`,
        type: 'warning',
        message: `今日的「${r.title}」还未服用，别忘了`,
        icon: '💊',
      })
    }
  }

  return alerts
}

export function getAllAlerts(
  habits: { id?: number; name: string }[],
  habitLogs: HabitLog[],
  bowelLogs: BowelLog[],
  weightLogs: WeightLog[],
  reminders: Reminder[],
  todayLogs: ReminderLog[]
): Alert[] {
  return [
    ...checkBowelsAlerts(bowelLogs),
    ...checkWeightAlerts(weightLogs),
    ...checkHabitAlerts(habits, habitLogs),
    ...checkReminderAlerts(reminders, todayLogs),
  ]
}
