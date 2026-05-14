import { create } from 'zustand'
import db, { type CultivationLog, type UserSettings } from '../db'
import { cultivationCards, type CultivationCard } from '../utils/cultivationCards'

interface CultivationState {
  enabledIds: string[]
  todayLogs: CultivationLog[]
  loading: boolean
  loadEnabledCards: () => Promise<void>
  loadTodayLogs: () => Promise<void>
  setEnabledCards: (ids: string[]) => Promise<void>
  completeCard: (cardId: string) => Promise<void>
  skipCard: (cardId: string) => Promise<void>
  getEnabledCards: () => CultivationCard[]
  getRemainingCards: () => CultivationCard[]
  allDone: () => boolean
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export const useCultivationStore = create<CultivationState>((set, get) => ({
  enabledIds: cultivationCards.map((c) => c.id),
  todayLogs: [],
  loading: false,

  loadEnabledCards: async () => {
    const setting = await db.settings.where({ key: 'cultivationCards' }).first()
    if (setting) {
      try {
        const ids = JSON.parse(setting.value) as string[]
        if (Array.isArray(ids) && ids.length > 0) {
          set({ enabledIds: ids })
          return
        }
      } catch {}
    }
    // Default: all enabled
    const allIds = cultivationCards.map((c) => c.id)
    set({ enabledIds: allIds })
  },

  loadTodayLogs: async () => {
    const dateStr = today()
    const logs = await db.cultivationLogs
      .where({ date: dateStr })
      .toArray()
    set({ todayLogs: logs })
  },

  setEnabledCards: async (ids) => {
    await db.settings.put({ key: 'cultivationCards', value: JSON.stringify(ids) })
    set({ enabledIds: ids })
  },

  completeCard: async (cardId) => {
    const dateStr = today()
    const existing = await db.cultivationLogs
      .where({ cardId, date: dateStr })
      .first()
    if (existing) {
      await db.cultivationLogs.update(existing.id!, { completed: true })
    } else {
      await db.cultivationLogs.add({
        cardId,
        date: dateStr,
        completed: true,
        createdAt: Date.now(),
      })
    }
    await get().loadTodayLogs()
  },

  skipCard: async (cardId) => {
    const dateStr = today()
    const existing = await db.cultivationLogs
      .where({ cardId, date: dateStr })
      .first()
    if (existing) return // already processed
    await db.cultivationLogs.add({
      cardId,
      date: dateStr,
      completed: false,
      createdAt: Date.now(),
    })
    await get().loadTodayLogs()
  },

  getEnabledCards: () => {
    const { enabledIds } = get()
    return cultivationCards.filter((c) => enabledIds.includes(c.id))
  },

  getRemainingCards: () => {
    const { enabledIds, todayLogs } = get()
    const doneIds = new Set(todayLogs.map((l) => l.cardId))
    return cultivationCards.filter((c) => enabledIds.includes(c.id) && !doneIds.has(c.id))
  },

  allDone: () => {
    return get().getRemainingCards().length === 0
  },
}))
