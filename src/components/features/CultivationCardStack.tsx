import { useState, useRef, useCallback, useEffect } from 'react'
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { CultivationCard } from '../../utils/cultivationCards'

interface Props {
  cards: CultivationCard[]
  onComplete: (cardId: string) => void
  onSkip: (cardId: string) => void
}

const SWIPE_THRESHOLD = 80

export default function CultivationCardStack({ cards, onComplete, onSkip }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [offsetX, setOffsetX] = useState(0)
  const [flying, setFlying] = useState<'left' | 'right' | null>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentCard = cards[currentIndex] || null

  const resetCard = useCallback(() => {
    setOffsetX(0)
    setFlying(null)
    setDragging(false)
  }, [])

  const advanceCard = useCallback((direction: 'left' | 'right') => {
    if (!currentCard) return
    setFlying(direction)
    setTimeout(() => {
      if (direction === 'right') {
        onComplete(currentCard.id)
      } else {
        onSkip(currentCard.id)
      }
      setCurrentIndex((i) => i + 1)
      resetCard()
    }, 300)
  }, [currentCard, onComplete, onSkip, resetCard])

  // Mouse events
  function onMouseDown(e: React.MouseEvent) {
    startX.current = e.clientX
    startY.current = e.clientY
    setDragging(true)
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || flying) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    // Only track horizontal drags
    if (Math.abs(dx) > Math.abs(dy) || Math.abs(dx) > 10) {
      setOffsetX(dx)
    }
  }

  function onMouseUp() {
    if (!dragging || flying) return
    setDragging(false)
    if (offsetX > SWIPE_THRESHOLD) {
      advanceCard('right')
    } else if (offsetX < -SWIPE_THRESHOLD) {
      advanceCard('left')
    } else {
      resetCard()
    }
  }

  // Touch events
  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    setDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging || flying) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (Math.abs(dx) > Math.abs(dy) || Math.abs(dx) > 10) {
      setOffsetX(dx)
    }
  }

  function onTouchEnd() {
    if (!dragging || flying) return
    setDragging(false)
    if (offsetX > SWIPE_THRESHOLD) {
      advanceCard('right')
    } else if (offsetX < -SWIPE_THRESHOLD) {
      advanceCard('left')
    } else {
      resetCard()
    }
  }

  if (cards.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 text-center">
        <Sparkles size={24} className="text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-muted">今日修炼卡片已全部完成</p>
        <p className="text-xs text-text-muted mt-1">明天再来，继续你的存在之美修炼</p>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="bg-card rounded-xl p-6 text-center">
        <Sparkles size={24} className="text-accent mx-auto mb-2" />
        <p className="text-[15px] text-text font-medium">今日修炼完成 ✨</p>
        <p className="text-xs text-text-muted mt-1">你已在存在的意义上，又精进了一步</p>
      </div>
    )
  }

  const rotate = offsetX * 0.05
  const opacity = 1 - Math.abs(offsetX) / 400

  const isSwipingRight = offsetX > SWIPE_THRESHOLD
  const isSwipingLeft = offsetX < -SWIPE_THRESHOLD

  return (
    <div className="relative" style={{ touchAction: 'none' }}>
      {/* Card */}
      <div
        ref={cardRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`bg-card rounded-2xl p-5 border border-border select-none cursor-grab active:cursor-grabbing transition-shadow ${
          isSwipingRight ? 'shadow-lg shadow-success/20 border-success/40' : ''
        } ${isSwipingLeft ? 'shadow-lg shadow-border/40 border-border/60' : ''}`}
        style={{
          transform: flying
            ? `translateX(${flying === 'right' ? 400 : -400}px) rotate(${flying === 'right' ? 15 : -15}deg)`
            : `translateX(${offsetX}px) rotate(${rotate}deg)`,
          opacity: flying ? 0 : opacity,
          transition: flying ? 'all 0.3s ease-out' : dragging ? 'none' : 'all 0.25s ease-out',
        }}
      >
        {/* Swipe hints */}
        <div
          className={`absolute inset-0 rounded-2xl flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
            isSwipingRight ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundColor: '#6B8E5A15' }}
        >
          <Check size={40} className="text-success" />
        </div>

        {/* Top accent bar */}
        <div className="w-8 h-0.5 rounded-full bg-accent mb-4" />

        {/* Card number */}
        <span className="text-[10px] text-text-muted uppercase tracking-widest">
          {currentCard.id} / 17
        </span>

        {/* Title */}
        <h3 className="text-[17px] font-medium text-text mt-1 mb-3">
          {currentCard.title}
        </h3>

        {/* Description */}
        <p className="text-[14px] text-text-muted leading-relaxed">
          {currentCard.description}
        </p>

        {/* Swipe indicators */}
        <div className="flex justify-between mt-5 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <ChevronLeft size={14} />
            <span>跳过</span>
          </div>
          <span className="text-xs text-text-muted">
            {currentIndex + 1} / {cards.length}
          </span>
          <div className="flex items-center gap-1 text-xs text-success">
            <span>完成</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* Buttons for non-touch devices */}
      <div className="flex justify-center gap-4 mt-3">
        <button
          onClick={() => advanceCard('left')}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:bg-border/30 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => advanceCard('right')}
          className="w-10 h-10 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success hover:bg-success/25 transition-colors"
        >
          <Check size={18} />
        </button>
      </div>
    </div>
  )
}
