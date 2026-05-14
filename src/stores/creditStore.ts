import { create } from 'zustand'
import db, { type CreditLog } from '../db'
import { getCreditStatus, type CreditStatus } from '../utils/credits'

interface CreditState {
  creditLogs: CreditLog[]
  balance: number
  earned: number
  spent: number
  loading: boolean
  loadCreditLogs: (days?: number) => Promise<void>
  getStatus: (habitCount: number) => CreditStatus
  earnCredits: (reason: string) => Promise<void>
  spendCredits: (amount: number, reason: string) => Promise<void>
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export const useCreditStore = create<CreditState>((set, get) => ({
  creditLogs: [],
  balance: 0,
  earned: 0,
  spent: 0,
  loading: false,

  loadCreditLogs: async (days = 7) => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const dateStr = since.toISOString().slice(0, 10)
    const logs = await db.creditLogs
      .where('date')
      .aboveOrEqual(dateStr)
      .toArray()
    const earned = logs
      .filter((l) => l.type === 'earn')
      .reduce((s, l) => s + l.amount, 0)
    const spent = logs
      .filter((l) => l.type === 'spend')
      .reduce((s, l) => s + Math.abs(l.amount), 0)
    set({ creditLogs: logs, earned, spent, balance: earned - spent })
  },

  getStatus: (habitCount) => {
    const { balance, earned, spent } = get()
    const maxPossible = habitCount * 7
    return getCreditStatus(balance, earned, spent, maxPossible)
  },

  earnCredits: async (reason) => {
    const dateStr = today()
    // Don't double-earn for same reason+date
    const existing = await db.creditLogs
      .where({ date: dateStr, type: 'earn' })
      .filter((l) => l.reason === reason)
      .first()
    if (existing) return

    await db.creditLogs.add({
      amount: 1,
      reason,
      type: 'earn',
      date: dateStr,
      createdAt: Date.now(),
    })
    await get().loadCreditLogs()
  },

  spendCredits: async (amount, reason) => {
    const dateStr = today()
    await db.creditLogs.add({
      amount: -amount,
      reason,
      type: 'spend',
      date: dateStr,
      createdAt: Date.now(),
    })
    await get().loadCreditLogs()
  },
}))
