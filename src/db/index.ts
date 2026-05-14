import Dexie, { type EntityTable } from 'dexie'

export interface Reminder {
  id?: number
  type: 'supplement' | 'herb' | 'custom'
  title: string
  dosage?: string
  times: string[] // ['09:00', '21:00']
  frequency: 'daily' | 'twice-daily' | 'every-other-day' | 'weekly'
  daysOfWeek?: number[] // 0-6, only for weekly
  enabled: boolean
  createdAt: number
}

export interface ReminderLog {
  id?: number
  reminderId: number
  scheduledAt: number
  completedAt?: number
  skipped: boolean
}

export interface Habit {
  id?: number
  name: string
  icon: string
  category: string
  color: string
  createdAt: number
}

export interface HabitLog {
  id?: number
  habitId: number
  date: string // 'YYYY-MM-DD'
  completed: boolean
}

export interface BowelLog {
  id?: number
  datetime: number
  bristolType: number // 1-7
  ease: number // 1-5
  note?: string
}

export interface WeightLog {
  id?: number
  date: string // 'YYYY-MM-DD'
  weight: number // kg
  note?: string
}

export interface SkinLog {
  id?: number
  date: string
  photoData?: Blob
  redness: number // 1-5
  acneLevel: number // 0-3 (none, few, medium, many)
  satisfaction: number // 1-5
  skincareUsed: string[]
  note?: string
}

export interface Milestone {
  id?: number
  title: string
  category: 'weight' | 'skin' | 'habit' | 'custom'
  habitId?: number
  targetValue: string // e.g. "57kg", "21天连续打卡"
  targetDate: string // 'YYYY-MM-DD'
  achieved: boolean
  achievedDate?: string
  createdAt: number
}

export interface UserSettings {
  key: string // primary key, e.g. 'height', 'age'
  value: string
}

export interface CreditLog {
  id?: number
  amount: number       // positive=earned, negative=spent
  reason: string       // "完成「运动」" or "吃美食放纵"
  type: 'earn' | 'spend'
  date: string         // 'YYYY-MM-DD'
  createdAt: number
}

export interface CultivationLog {
  id?: number
  cardId: string       // '01'~'17'
  date: string         // 'YYYY-MM-DD'
  completed: boolean   // true=右滑完成, false=左滑跳过
  createdAt: number
}

const db = new Dexie('benzhen') as Dexie & {
  reminders: EntityTable<Reminder, 'id'>
  reminderLogs: EntityTable<ReminderLog, 'id'>
  habits: EntityTable<Habit, 'id'>
  habitLogs: EntityTable<HabitLog, 'id'>
  bowelLogs: EntityTable<BowelLog, 'id'>
  weightLogs: EntityTable<WeightLog, 'id'>
  skinLogs: EntityTable<SkinLog, 'id'>
  milestones: EntityTable<Milestone, 'id'>
  settings: EntityTable<UserSettings, 'key'>
  creditLogs: EntityTable<CreditLog, 'id'>
  cultivationLogs: EntityTable<CultivationLog, 'id'>
}

db.version(1).stores({
  reminders: '++id, type, enabled',
  reminderLogs: '++id, reminderId, scheduledAt',
  habits: '++id, category',
  habitLogs: '++id, habitId, date, [habitId+date]',
  bowelLogs: '++id, datetime',
  weightLogs: '++id, date',
  skinLogs: '++id, date',
})

db.version(2).stores({
  reminders: '++id, type, enabled',
  reminderLogs: '++id, reminderId, scheduledAt',
  habits: '++id, category',
  habitLogs: '++id, habitId, date, [habitId+date]',
  bowelLogs: '++id, datetime',
  weightLogs: '++id, date',
  skinLogs: '++id, date',
  milestones: '++id, category, targetDate',
  settings: '&key',
})

db.version(3).stores({
  reminders: '++id, type, enabled',
  reminderLogs: '++id, reminderId, scheduledAt',
  habits: '++id, category',
  habitLogs: '++id, habitId, date, [habitId+date]',
  bowelLogs: '++id, datetime',
  weightLogs: '++id, date',
  skinLogs: '++id, date',
  milestones: '++id, category, targetDate',
  settings: '&key',
  creditLogs: '++id, date, type',
  cultivationLogs: '++id, cardId, date, [cardId+date]',
})

export default db
