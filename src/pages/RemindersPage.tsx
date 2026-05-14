import { useEffect, useState } from 'react'
import { Plus, Bell, Trash2, X, Check } from 'lucide-react'
import { useReminderStore } from '../stores/reminderStore'
import type { Reminder } from '../db'

const typeLabels: Record<string, string> = {
  supplement: '保健品',
  herb: '中药',
  custom: '自定义',
}

const freqLabels: Record<string, string> = {
  daily: '每天',
  'twice-daily': '每天两次',
  'every-other-day': '隔天',
  weekly: '每周',
}

const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

interface FormData {
  type: Reminder['type']
  title: string
  dosage: string
  times: string[]
  frequency: Reminder['frequency']
  daysOfWeek: number[]
  enabled: boolean
}

const emptyForm: FormData = {
  type: 'supplement',
  title: '',
  dosage: '',
  times: ['09:00'],
  frequency: 'daily',
  daysOfWeek: [],
  enabled: true,
}

export default function RemindersPage() {
  const { reminders, todayLogs, loadTodayLogs, addReminder, updateReminder, deleteReminder, completeReminder, skipReminder } =
    useReminderStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  useEffect(() => {
    loadTodayLogs()
  }, [])

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  function openNew() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(r: Reminder) {
    setEditingId(r.id!)
    setForm({
      type: r.type,
      title: r.title,
      dosage: r.dosage || '',
      times: r.times,
      frequency: r.frequency,
      daysOfWeek: r.daysOfWeek || [],
      enabled: r.enabled,
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.title.trim()) return
    if (editingId) {
      await updateReminder(editingId, form)
    } else {
      await addReminder(form)
    }
    setShowForm(false)
  }

  function addTime() {
    setForm({ ...form, times: [...form.times, '12:00'] })
  }

  function updateTime(i: number, val: string) {
    const t = [...form.times]
    t[i] = val
    setForm({ ...form, times: t })
  }

  function removeTime(i: number) {
    if (form.times.length <= 1) return
    setForm({ ...form, times: form.times.filter((_, idx) => idx !== i) })
  }

  function toggleDay(d: number) {
    const has = form.daysOfWeek.includes(d)
    setForm({
      ...form,
      daysOfWeek: has ? form.daysOfWeek.filter((x) => x !== d) : [...form.daysOfWeek, d],
    })
  }

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-text">提醒</h1>
        <button
          onClick={openNew}
          className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Reminder List */}
      {reminders.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <Bell size={40} className="text-border mx-auto mb-3" />
          <p className="text-text-muted mb-4">还没有设置提醒</p>
          <button
            onClick={openNew}
            className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm"
          >
            创建第一个提醒
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => {
            const items = r.times.map((t) => {
              const [h, m] = t.split(':').map(Number)
              const schedMin = h * 60 + m
              const schedAt = new Date()
              schedAt.setHours(h, m, 0, 0)
              const log = todayLogs.find(
                (l) => l.reminderId === r.id && l.scheduledAt === schedAt.getTime()
              )
              return { time: t, schedMin, schedAt, done: log?.completedAt != null, skipped: log?.skipped }
            })
            return (
              <div
                key={r.id}
                className={`bg-card rounded-xl overflow-hidden ${
                  !r.enabled ? 'opacity-50' : ''
                }`}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => openEdit(r)}>
                    <div className="w-9 h-9 rounded-full bg-reminder/15 flex items-center justify-center">
                      <Bell size={18} className="text-reminder" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] text-text">{r.title}</p>
                        <span className="text-[10px] text-text-muted bg-border px-1.5 py-0.5 rounded">
                          {typeLabels[r.type]}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">
                        {r.times.join(' / ')}
                        {r.dosage ? ` · ${r.dosage}` : ''}
                        {' · '}
                        {freqLabels[r.frequency]}
                        {r.frequency === 'weekly' && r.daysOfWeek?.length
                          ? ` (${r.daysOfWeek.map((d) => dayLabels[d]).join(' ')})`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(r.id!)}
                    className="p-2 text-text-muted"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Quick actions for today's times */}
                <div className="px-4 pb-3 flex gap-2">
                  {items.map((item) => (
                    <div key={item.time} className="flex-1">
                      {item.done ? (
                        <div className="bg-success/10 rounded-lg py-1.5 text-center">
                          <Check size={14} className="text-success mx-auto" />
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => completeReminder(r.id!, item.schedAt.getTime())}
                            className={`flex-1 rounded-lg py-1.5 text-xs ${
                              item.schedMin < currentMinutes
                                ? 'bg-accent text-white'
                                : 'bg-border text-text-muted'
                            }`}
                          >
                            {item.time}
                          </button>
                          <button
                            onClick={() => skipReminder(r.id!, item.schedAt.getTime())}
                            className="px-2 rounded-lg bg-border text-text-muted text-xs"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
          <div className="bg-card w-full max-w-[480px] rounded-t-2xl p-5 max-h-[80dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-text">
                {editingId ? '编辑提醒' : '新建提醒'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1">
                <X size={22} className="text-text-muted" />
              </button>
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="text-xs text-text-muted mb-1.5 block">类型</label>
              <div className="flex gap-2">
                {(['supplement', 'herb', 'custom'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2 rounded-lg text-sm ${
                      form.type === t
                        ? 'bg-accent text-white'
                        : 'bg-border/50 text-text-muted'
                    }`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="text-xs text-text-muted mb-1.5 block">名称</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="如：维生素C+胶原蛋白"
                className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none focus:ring-1 ring-accent"
              />
            </div>

            {/* Dosage */}
            <div className="mb-4">
              <label className="text-xs text-text-muted mb-1.5 block">剂量（选填）</label>
              <input
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                placeholder="如：每次2粒"
                className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none focus:ring-1 ring-accent"
              />
            </div>

            {/* Times */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-text-muted">提醒时间</label>
                <button onClick={addTime} className="text-xs text-accent">
                  + 添加时间
                </button>
              </div>
              <div className="space-y-2">
                {form.times.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => updateTime(i, e.target.value)}
                      className="flex-1 bg-border/30 rounded-lg px-3 py-2 text-[15px] text-text outline-none focus:ring-1 ring-accent"
                    />
                    {form.times.length > 1 && (
                      <button
                        onClick={() => removeTime(i)}
                        className="p-2 text-text-muted"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="mb-4">
              <label className="text-xs text-text-muted mb-1.5 block">频率</label>
              <div className="flex gap-2 flex-wrap">
                {(['daily', 'twice-daily', 'every-other-day', 'weekly'] as const).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setForm({ ...form, frequency: f })}
                      className={`py-2 px-3 rounded-lg text-sm ${
                        form.frequency === f
                          ? 'bg-accent text-white'
                          : 'bg-border/50 text-text-muted'
                      }`}
                    >
                      {freqLabels[f]}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Days of week for weekly */}
            {form.frequency === 'weekly' && (
              <div className="mb-4">
                <label className="text-xs text-text-muted mb-1.5 block">选择星期</label>
                <div className="flex gap-2">
                  {dayLabels.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`w-9 h-9 rounded-full text-sm ${
                        form.daysOfWeek.includes(i)
                          ? 'bg-accent text-white'
                          : 'bg-border/50 text-text-muted'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enabled */}
            <div className="mb-5 flex items-center justify-between">
              <label className="text-sm text-text">启用</label>
              <button
                onClick={() => setForm({ ...form, enabled: !form.enabled })}
                className={`w-11 h-6 rounded-full transition-colors ${
                  form.enabled ? 'bg-accent' : 'bg-border'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={save}
              disabled={!form.title.trim()}
              className="w-full bg-accent text-white py-3 rounded-xl text-[15px] font-medium disabled:opacity-40"
            >
              {editingId ? '保存' : '创建提醒'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
