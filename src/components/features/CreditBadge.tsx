import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import { useCreditStore } from '../../stores/creditStore'
import { useHabitStore } from '../../stores/habitStore'
import { getLevelEmoji, getLevelColor, type CreditStatus } from '../../utils/credits'

interface Props {
  onClick: () => void
}

export default function CreditBadge({ onClick }: Props) {
  const { balance, loadCreditLogs, getStatus } = useCreditStore()
  const habits = useHabitStore((s) => s.habits)
  const [status, setStatus] = useState<CreditStatus | null>(null)

  useEffect(() => {
    loadCreditLogs()
  }, [])

  useEffect(() => {
    setStatus(getStatus(habits.length))
  }, [balance, habits.length])

  if (!status) return null

  const emoji = getLevelEmoji(status.level)
  const color = getLevelColor(status.level)

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border transition-colors hover:bg-border/30"
    >
      <Coins size={14} style={{ color }} />
      <span className="text-sm font-medium" style={{ color }}>
        {emoji} {status.balance}
      </span>
    </button>
  )
}
