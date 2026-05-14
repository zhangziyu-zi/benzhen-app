export type CreditLevel = 'abundant' | 'moderate' | 'low'

export interface CreditStatus {
  balance: number
  earned: number
  spent: number
  maxPossible: number
  level: CreditLevel
  label: string
  hint: string
}

const LEVEL_CONFIG: Record<CreditLevel, { label: string; emoji: string; color: string }> = {
  abundant: { label: '充裕', emoji: '🌿', color: '#6B8E5A' },
  moderate: { label: '一般', emoji: '🍂', color: '#C8956C' },
  low: { label: '不足', emoji: '🔥', color: '#C9807A' },
}

const HINTS: Record<CreditLevel, string> = {
  abundant: '你已积累足够的自律余额，值得犒赏自己',
  moderate: '自律余额正常，继续保持',
  low: '自律余额偏低，今天再坚持一下',
}

export function getCreditLevel(balance: number, maxPossible: number): CreditLevel {
  if (maxPossible === 0) return 'moderate'
  const ratio = balance / maxPossible
  if (ratio >= 0.7) return 'abundant'
  if (ratio >= 0.35) return 'moderate'
  return 'low'
}

export function getCreditStatus(balance: number, earned: number, spent: number, maxPossible: number): CreditStatus {
  const level = getCreditLevel(balance, maxPossible)
  const config = LEVEL_CONFIG[level]
  return {
    balance,
    earned,
    spent,
    maxPossible,
    level,
    label: config.label,
    hint: HINTS[level],
  }
}

export function getLevelEmoji(level: CreditLevel): string {
  return LEVEL_CONFIG[level].emoji
}

export function getLevelColor(level: CreditLevel): string {
  return LEVEL_CONFIG[level].color
}

// Predefined indulgence costs
export const INDULGENCE_OPTIONS = [
  { value: 'food', label: '吃美食', cost: 2, emoji: '🍽️' },
  { value: 'skip_exercise', label: '不运动', cost: 3, emoji: '🛌' },
  { value: 'skip_skincare', label: '跳过护肤', cost: 1, emoji: '😴' },
  { value: 'custom', label: '其他放纵', cost: 1, emoji: '✨' },
]
