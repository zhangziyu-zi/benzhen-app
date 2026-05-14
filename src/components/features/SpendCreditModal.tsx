import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreditStore } from '../../stores/creditStore'
import { INDULGENCE_OPTIONS } from '../../utils/credits'

interface Props {
  show: boolean
  onClose: () => void
}

export default function SpendCreditModal({ show, onClose }: Props) {
  const { balance, spendCredits } = useCreditStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [customCost, setCustomCost] = useState(2)

  if (!show) return null

  const selectedOption = INDULGENCE_OPTIONS.find((o) => o.value === selected)
  const cost = selected === 'custom' ? customCost : (selectedOption?.cost || 0)
  const canAfford = balance >= cost

  async function handleSpend() {
    if (!canAfford || !selected) return
    const reason = selected === 'custom'
      ? '其他放纵'
      : (selectedOption?.label || '放纵')
    await spendCredits(cost, reason)
    setSelected(null)
    setCustomCost(2)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-card w-full max-w-[480px] rounded-t-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-text">记录放纵</h2>
            <p className="text-xs text-text-muted mt-0.5">
              当前余额：{balance} 分 {!canAfford && balance > 0 ? '· 余额不足' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1">
            <X size={22} className="text-text-muted" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {INDULGENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`flex flex-col items-center py-3 rounded-xl border transition-colors ${
                selected === opt.value
                  ? 'border-accent-warm bg-accent-warm/10'
                  : 'border-border bg-border/20'
              }`}
            >
              <span className="text-2xl mb-1">{opt.emoji}</span>
              <span className="text-sm text-text">{opt.label}</span>
              <span className="text-xs text-text-muted">-{opt.cost} 分</span>
            </button>
          ))}
        </div>

        {selected === 'custom' && (
          <div className="mb-4">
            <label className="text-xs text-text-muted mb-1.5 block">消耗分数</label>
            <input
              type="number"
              value={customCost}
              onChange={(e) => setCustomCost(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={balance}
              className="w-full bg-border/30 rounded-lg px-3 py-2 text-[15px] text-text outline-none"
            />
          </div>
        )}

        <button
          onClick={handleSpend}
          disabled={!selected || !canAfford}
          className="w-full bg-accent-warm text-white py-3 rounded-xl text-[15px] font-medium disabled:opacity-40"
        >
          确认消耗 {cost} 分
        </button>

        {!canAfford && balance === 0 && (
          <p className="text-xs text-text-muted text-center mt-2">
            自律余额为0，完成更多打卡来挣取余额吧
          </p>
        )}
      </div>
    </div>
  )
}
