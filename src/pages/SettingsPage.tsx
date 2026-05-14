import { useEffect, useState } from 'react'
import { Trash2, Plus, X, Info } from 'lucide-react'
import { useHabitStore } from '../stores/habitStore'
import { useReminderStore } from '../stores/reminderStore'
import { useBeautyStore } from '../stores/beautyStore'
import { useCultivationStore } from '../stores/cultivationStore'
import { cultivationCards } from '../utils/cultivationCards'
import { getDailyQuote } from '../utils/philosophy'
import db from '../db'

const presetColors = [
  '#9CAF88', // sage green
  '#C4A49A', // terracotta
  '#C8956C', // amber
  '#8BA4C4', // dusty blue
  '#B8A9C9', // lavender
  '#D4A574', // tan
  '#7BA587', // forest
  '#C9807A', // rose
]

export default function SettingsPage() {
  const { habits, addHabit, deleteHabit } = useHabitStore()
  const { reminders } = useReminderStore()
  const { settings, setSetting, loadSettings } = useBeautyStore()
  const { enabledIds, loadEnabledCards, setEnabledCards } = useCultivationStore()

  const [showHabitForm, setShowHabitForm] = useState(false)
  const [habitName, setHabitName] = useState('')
  const [habitColor, setHabitColor] = useState(presetColors[0])
  const [heightVal, setHeightVal] = useState(settings['height'] || '')
  const [quote] = useState(getDailyQuote)

  useEffect(() => { loadSettings(); loadEnabledCards() }, [])
  useEffect(() => { setHeightVal(settings['height'] || '') }, [settings])

  async function saveHabit() {
    if (!habitName.trim()) return
    await addHabit({
      name: habitName.trim(),
      icon: 'circle',
      category: 'custom',
      color: habitColor,
    })
    setShowHabitForm(false)
    setHabitName('')
    setHabitColor(presetColors[0])
  }

  function exportData() {
    Promise.all([
      db.reminders.toArray(),
      db.reminderLogs.toArray(),
      db.habits.toArray(),
      db.habitLogs.toArray(),
      db.bowelLogs.toArray(),
      db.weightLogs.toArray(),
      db.skinLogs.toArray(),
    ]).then(([reminders, reminderLogs, habits, habitLogs, bowelLogs, weightLogs, skinLogs]) => {
      const data = {
        exportedAt: new Date().toISOString(),
        reminders,
        reminderLogs,
        habits,
        habitLogs,
        bowelLogs,
        weightLogs,
        skinLogs,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `benzhen-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-2xl font-medium text-text mb-6">设置</h1>

      {/* Habits Management */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
            我的习惯
          </h2>
          <button
            onClick={() => setShowHabitForm(true)}
            className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="bg-card rounded-xl p-5 text-center">
            <p className="text-text-muted text-sm">还没有习惯</p>
            <p className="text-text-muted text-xs mt-1">
              添加你想养成的日常习惯，如运动、护肤、喝水
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-card rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="text-[15px] text-text">{habit.name}</span>
                </div>
                <button
                  onClick={() => deleteHabit(habit.id!)}
                  className="p-2 text-text-muted"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Body Data */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          身体数据
        </h2>
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text">身高</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                value={heightVal}
                onChange={(e) => setHeightVal(e.target.value)}
                onBlur={() => {
                  const v = parseFloat(heightVal)
                  if (v && v >= 100 && v <= 250) setSetting('height', String(v))
                }}
                placeholder="如：165"
                className="w-20 bg-border/30 rounded-lg px-3 py-2 text-sm text-text text-right placeholder:text-text-muted/50 outline-none"
              />
              <span className="text-sm text-text-muted">cm</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">用于计算 BMI，记录后体重页将显示 BMI 趋势</p>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          数据概览
        </h2>
        <div className="bg-card rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-text-muted">提醒数量</span>
            <span className="text-sm text-text">{reminders.length} 个</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-muted">打卡习惯</span>
            <span className="text-sm text-text">{habits.length} 个</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-muted">数据存储</span>
            <span className="text-sm text-success">本地 IndexedDB</span>
          </div>
        </div>
      </section>

      {/* Cultivation Cards Toggle */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          修炼卡片
        </h2>
        <p className="text-xs text-text-muted mb-3">选择哪些卡片显示在首页，滑动完成每日修炼</p>
        <div className="bg-card rounded-xl p-2 divide-y divide-border/30">
          {cultivationCards.map((card) => {
            const enabled = enabledIds.includes(card.id)
            return (
              <div key={card.id} className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[10px] text-text-muted font-mono w-5">{card.id}</span>
                  <span className="text-sm text-text truncate">{card.title}</span>
                </div>
                <button
                  onClick={() => {
                    const next = enabled
                      ? enabledIds.filter((id) => id !== card.id)
                      : [...enabledIds, card.id]
                    setEnabledCards(next)
                  }}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                    enabled ? 'bg-accent' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Export */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          数据管理
        </h2>
        <button
          onClick={exportData}
          className="w-full bg-card rounded-xl p-4 text-center border border-border"
        >
          <span className="text-[15px] text-accent">导出数据备份 (JSON)</span>
          <p className="text-xs text-text-muted mt-0.5">
            备份包含所有记录，可保存到电脑或云端
          </p>
        </button>
      </section>

      {/* About */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
          关于本真
        </h2>
        <div className="bg-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-accent" />
            <span className="text-sm text-text font-medium">设计哲学</span>
          </div>
          <p className="text-sm text-text-muted leading-relaxed mb-4 italic">
            「{quote}」
          </p>
          <div className="space-y-2 text-xs text-text-muted leading-relaxed">
            <p>美是作为"存在"的缺席而开始显现的。变美，不是一个叠加，而是一场删减。</p>
            <p>你祛除社会目光在你身上烙下的"非我"，于是，本质的灵韵开始透气。</p>
            <p>变美是一场主观意志对客观质料的"教化"。你不再是被动承受岁月刻刀的石料，而是拿起刻刀的自己。</p>
            <p>这不是向着他者的献媚，而是向着"本我"的回归。你不再追问"我看起来如何？"，而是宣布"我选择如此存在"。</p>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-text-muted pb-4">
        本真 v1.0 · 美是删减
      </p>

      {/* Add Habit Modal */}
      {showHabitForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
          <div className="bg-card w-full max-w-[480px] rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-text">添加习惯</h2>
              <button onClick={() => setShowHabitForm(false)} className="p-1">
                <X size={22} className="text-text-muted" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs text-text-muted mb-1.5 block">习惯名称</label>
              <input
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="如：运动、护肤、喝水8杯、早睡"
                className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none focus:ring-1 ring-accent"
              />
            </div>

            <div className="mb-5">
              <label className="text-xs text-text-muted mb-2 block">颜色标记</label>
              <div className="flex gap-2 flex-wrap">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setHabitColor(c)}
                    className="w-9 h-9 rounded-full transition-transform"
                    style={{
                      backgroundColor: c,
                      transform: habitColor === c ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: habitColor === c ? `0 0 0 2px ${c}40` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={saveHabit}
              disabled={!habitName.trim()}
              className="w-full bg-accent text-white py-3 rounded-xl text-[15px] font-medium disabled:opacity-40"
            >
              添加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
