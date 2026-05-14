import { create } from 'zustand'
import db, { type Reminder, type ReminderLog } from '../db'

interface ReminderState {
  reminders: Reminder[]
  todayLogs: ReminderLog[]
  loading: boolean
  loadReminders: () => Promise<void>
  loadTodayLogs: () => Promise<void>
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt'>) => Promise<number>
  updateReminder: (id: number, r: Partial<Reminder>) => Promise<void>
  deleteReminder: (id: number) => Promise<void>
  completeReminder: (reminderId: number, scheduledAt: number) => Promise<void>
  skipReminder: (reminderId: number, scheduledAt: number) => Promise<void>
  getPendingForToday: () => { reminder: Reminder; log?: ReminderLog }[]
}

function todayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  todayLogs: [],
  loading: false,

  loadReminders: async () => {
    const reminders = await db.reminders.toArray()
    set({ reminders })
  },

  loadTodayLogs: async () => {
    const start = todayStart()
    const end = start + 86400000
    const todayLogs = await db.reminderLogs
      .where('scheduledAt')
      .between(start, end, true, false)
      .toArray()
    set({ todayLogs })
  },

  addReminder: async (r) => {
    const id = await db.reminders.add({
      ...r,
      createdAt: Date.now(),
    })
    await get().loadReminders()
    return id as number
  },

  updateReminder: async (id, r) => {
    await db.reminders.update(id, r)
    await get().loadReminders()
  },

  deleteReminder: async (id) => {
    await db.reminders.delete(id)
    await get().loadReminders()
  },

  completeReminder: async (reminderId, scheduledAt) => {
    const existing = await db.reminderLogs
      .where({ reminderId, scheduledAt })
      .first()
    if (existing) {
      await db.reminderLogs.update(existing.id!, { completedAt: Date.now(), skipped: false })
    } else {
      await db.reminderLogs.add({ reminderId, scheduledAt, completedAt: Date.now(), skipped: false })
    }
    await get().loadTodayLogs()
  },

  skipReminder: async (reminderId, scheduledAt) => {
    const existing = await db.reminderLogs
      .where({ reminderId, scheduledAt })
      .first()
    if (existing) {
      await db.reminderLogs.update(existing.id!, { skipped: true })
    } else {
      await db.reminderLogs.add({ reminderId, scheduledAt, skipped: true })
    }
    await get().loadTodayLogs()
  },

  getPendingForToday: () => {
    const { reminders, todayLogs } = get()
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    return reminders
      .filter((r) => r.enabled)
      .flatMap((reminder) => {
        return reminder.times.map((timeStr) => {
          const [h, m] = timeStr.split(':').map(Number)
          const scheduledMinutes = h * 60 + m
          // Only show past or near-future (within 30 min) reminders
          if (scheduledMinutes > currentMinutes + 30) return null
          const scheduledAt = new Date()
          scheduledAt.setHours(h, m, 0, 0)
          const log = todayLogs.find(
            (l) => l.reminderId === reminder.id && l.scheduledAt === scheduledAt.getTime()
          )
          return { reminder, log }
        }).filter(Boolean)
      }) as { reminder: Reminder; log?: ReminderLog }[]
  },
}))
