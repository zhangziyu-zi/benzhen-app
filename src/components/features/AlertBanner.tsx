import { X } from 'lucide-react'
import type { Alert } from '../../utils/alerts'

interface Props {
  alerts: Alert[]
  onDismiss: (id: string) => void
}

export default function AlertBanner({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-xl p-3 flex items-start gap-3 ${
            alert.type === 'danger'
              ? 'bg-reminder/15 border border-reminder/30'
              : 'bg-reminder/8 border border-reminder/20'
          }`}
        >
          <span className="text-lg flex-shrink-0">{alert.icon}</span>
          <p className="text-sm text-text flex-1 leading-relaxed">{alert.message}</p>
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-0.5 flex-shrink-0 text-text-muted"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
