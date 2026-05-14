import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { getRandomCelebration } from '../../utils/celebrations'

interface Props {
  show: boolean
  onClose: () => void
}

export default function CelebrationModal({ show, onClose }: Props) {
  const [quote] = useState(getRandomCelebration)
  const [visible, setVisible] = useState(false)
  const [particles] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: 4 + Math.random() * 8,
      color: ['#9CAF88', '#C4A49A', '#C8956C', '#D4A574', '#8BA4C4', '#B8A9C9'][
        Math.floor(Math.random() * 6)
      ],
    }))
  )

  useEffect(() => {
    if (show) {
      setTimeout(() => setVisible(true), 50)
      const t = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 400)
      }, 3500)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [show])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-sparkle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: '1.5s',
          }}
        />
      ))}

      {/* Card */}
      <div
        className={`relative bg-card rounded-2xl p-8 mx-5 max-w-sm text-center shadow-lg transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={32} className="text-accent" />
        </div>
        <h2 className="text-xl font-medium text-text mb-2">你做到了 ✨</h2>
        <p className="text-[15px] text-text-muted leading-relaxed italic">
          「{quote}」
        </p>
        <button
          onClick={onClose}
          className="mt-6 text-sm text-accent"
        >
          继续前行
        </button>
      </div>

      <style>{`
        @keyframes sparkle {
          0% { transform: scale(1) translate(0, 0); opacity: 1; }
          100% { transform: scale(0) translate(${20 + Math.random() * 60}px, ${-40 - Math.random() * 60}px); opacity: 0; }
        }
        .animate-sparkle {
          animation: sparkle 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
