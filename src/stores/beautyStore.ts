import { create } from 'zustand'
import db, { type WeightLog, type SkinLog, type Milestone } from '../db'

interface BeautyState {
  weightLogs: WeightLog[]
  skinLogs: SkinLog[]
  milestones: Milestone[]
  settings: Record<string, string>
  loading: boolean
  loadWeightLogs: (days?: number) => Promise<void>
  loadSkinLogs: (days?: number) => Promise<void>
  loadMilestones: () => Promise<void>
  loadSettings: () => Promise<void>
  addWeight: (log: Omit<WeightLog, 'id'>) => Promise<number | undefined>
  addSkinLog: (log: Omit<SkinLog, 'id'>) => Promise<void>
  addMilestone: (m: Omit<Milestone, 'id' | 'createdAt'>) => Promise<void>
  updateMilestone: (id: number, m: Partial<Milestone>) => Promise<void>
  deleteMilestone: (id: number) => Promise<void>
  setSetting: (key: string, value: string) => Promise<void>
  getSetting: (key: string) => string | undefined
  getWeightMilestones: () => { achieved: boolean; kg: number; label: string }[]
  getBMI: () => number | null
  getPreviousWeight: (date: string) => number | null
}

export const useBeautyStore = create<BeautyState>((set, get) => ({
  weightLogs: [],
  skinLogs: [],
  milestones: [],
  settings: {},
  loading: false,

  loadWeightLogs: async (days = 90) => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const dateStr = since.toISOString().slice(0, 10)
    const logs = await db.weightLogs
      .where('date')
      .aboveOrEqual(dateStr)
      .toArray()
    logs.sort((a, b) => a.date.localeCompare(b.date))
    set({ weightLogs: logs })
  },

  loadSkinLogs: async (days = 90) => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const dateStr = since.toISOString().slice(0, 10)
    const logs = await db.skinLogs
      .where('date')
      .aboveOrEqual(dateStr)
      .toArray()
    logs.sort((a, b) => b.date.localeCompare(a.date))
    set({ skinLogs: logs })
  },

  loadMilestones: async () => {
    const milestones = await db.milestones.toArray()
    set({ milestones })
  },

  loadSettings: async () => {
    const all = await db.settings.toArray()
    const settings: Record<string, string> = {}
    for (const s of all) {
      settings[s.key] = s.value
    }
    set({ settings })
  },

  addWeight: async (log) => {
    const existing = await db.weightLogs.where({ date: log.date }).first()
    if (existing) {
      await db.weightLogs.update(existing.id!, log)
    } else {
      await db.weightLogs.add(log)
    }
    await get().loadWeightLogs()
    return existing?.id
  },

  addSkinLog: async (log) => {
    const existing = await db.skinLogs.where({ date: log.date }).first()
    if (existing) {
      await db.skinLogs.update(existing.id!, log)
    } else {
      await db.skinLogs.add(log)
    }
    await get().loadSkinLogs()
  },

  addMilestone: async (m) => {
    await db.milestones.add({ ...m, createdAt: Date.now() })
    await get().loadMilestones()
  },

  updateMilestone: async (id, m) => {
    await db.milestones.update(id, m)
    await get().loadMilestones()
  },

  deleteMilestone: async (id) => {
    await db.milestones.delete(id)
    await get().loadMilestones()
  },

  setSetting: async (key, value) => {
    await db.settings.put({ key, value })
    const settings = { ...get().settings, [key]: value }
    set({ settings })
  },

  getSetting: (key) => {
    return get().settings[key]
  },

  getWeightMilestones: () => {
    const logs = get().weightLogs
    if (logs.length === 0) return []
    const sorted = [...logs].sort((a, b) => a.weight - b.weight)
    const min = sorted[0].weight
    const max = sorted[sorted.length - 1].weight
    const milestones: { achieved: boolean; kg: number; label: string }[] = []
    const current = logs[logs.length - 1].weight

    let start = Math.ceil(max / 2) * 2
    while (start >= min - 1) {
      milestones.push({
        achieved: current <= start,
        kg: start,
        label: `${start}kg`,
      })
      start -= 2
    }
    return milestones.reverse()
  },

  getBMI: () => {
    const { weightLogs, settings } = get()
    const heightStr = settings['height']
    if (!heightStr || weightLogs.length === 0) return null
    const heightCm = parseFloat(heightStr)
    if (!heightCm || heightCm < 100) return null
    const weight = weightLogs[weightLogs.length - 1].weight
    const heightM = heightCm / 100
    return Math.round((weight / (heightM * heightM)) * 10) / 10
  },

  getPreviousWeight: (date: string) => {
    const logs = get().weightLogs
    const idx = logs.findIndex((l) => l.date === date)
    if (idx > 0) return logs[idx - 1].weight
    return null
  },
}))
