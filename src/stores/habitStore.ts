import { create } from 'zustand'
import db, { type Habit, type HabitLog, type BowelLog } from '../db'

interface HabitState {
  habits: Habit[]
  todayHabitLogs: HabitLog[]
  monthHabitLogs: HabitLog[]
  bowelLogs: BowelLog[]
  bowelLogsAll: BowelLog[]
  loading: boolean
  loadHabits: () => Promise<void>
  loadTodayHabitLogs: () => Promise<void>
  loadHabitLogsForRange: (from: string, to: string) => Promise<void>
  loadBowelLogs: (days?: number) => Promise<void>
  loadAllBowelLogs: () => Promise<void>
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>
  deleteHabit: (id: number) => Promise<void>
  toggleHabit: (habitId: number, date?: string) => Promise<void>
  isHabitDone: (habitId: number, date?: string) => boolean
  isHabitDoneInMonth: (habitId: number, date: string) => boolean
  addBowelLog: (log: Omit<BowelLog, 'id'>) => Promise<void>
  getStreak: (habitId: number) => Promise<number>
  getHabitStats: (habitId: number) => Promise<{ total: number; streak: number; monthRate: number }>
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayHabitLogs: [],
  monthHabitLogs: [],
  bowelLogs: [],
  bowelLogsAll: [],
  loading: false,

  loadHabits: async () => {
    const habits = await db.habits.toArray()
    set({ habits })
  },

  loadTodayHabitLogs: async () => {
    const date = today()
    const logs = await db.habitLogs.where({ date }).toArray()
    set({ todayHabitLogs: logs })
  },

  loadHabitLogsForRange: async (from, to) => {
    const logs = await db.habitLogs
      .where('date')
      .between(from, to, true, true)
      .toArray()
    set({ monthHabitLogs: logs })
  },

  loadBowelLogs: async (days = 7) => {
    const since = Date.now() - days * 86400000
    const logs = await db.bowelLogs
      .where('datetime')
      .above(since)
      .reverse()
      .toArray()
    set({ bowelLogs: logs })
  },

  loadAllBowelLogs: async () => {
    const logs = await db.bowelLogs
      .orderBy('datetime')
      .reverse()
      .toArray()
    set({ bowelLogsAll: logs })
  },

  addHabit: async (h) => {
    await db.habits.add({ ...h, createdAt: Date.now() })
    await get().loadHabits()
  },

  deleteHabit: async (id) => {
    await db.habits.delete(id)
    // Clean up related logs
    await db.habitLogs.where({ habitId: id }).delete()
    await get().loadHabits()
  },

  toggleHabit: async (habitId, date) => {
    const dateStr = date || today()
    const existing = await db.habitLogs
      .where({ habitId, date: dateStr })
      .first()
    if (existing) {
      await db.habitLogs.update(existing.id!, { completed: !existing.completed })
    } else {
      await db.habitLogs.add({ habitId, date: dateStr, completed: true })
    }
    await get().loadTodayHabitLogs()
  },

  isHabitDone: (habitId, date) => {
    const dateStr = date || today()
    return get().todayHabitLogs.some(
      (l) => l.habitId === habitId && l.date === dateStr && l.completed
    )
  },

  isHabitDoneInMonth: (habitId, dateStr) => {
    return get().monthHabitLogs.some(
      (l) => l.habitId === habitId && l.date === dateStr && l.completed
    )
  },

  addBowelLog: async (log) => {
    await db.bowelLogs.add(log)
    await get().loadBowelLogs()
  },

  getStreak: async (habitId) => {
    const logs = await db.habitLogs
      .where({ habitId, completed: true })
      .toArray()
    const dates = logs
      .map((l) => l.date)
      .sort()
      .reverse()

    let streak = 0
    const cur = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(cur)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      if (dates.includes(ds)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  },

  getHabitStats: async (habitId) => {
    const allLogs = await db.habitLogs
      .where({ habitId, completed: true })
      .toArray()
    const total = allLogs.length
    const streak = await get().getStreak(habitId)

    // Month completion rate
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const monthCompletions = allLogs.filter((l) => l.date >= monthStart).length
    const monthRate = Math.round((monthCompletions / Math.min(daysInMonth, new Date().getDate())) * 100)

    return { total, streak, monthRate }
  },
}))
