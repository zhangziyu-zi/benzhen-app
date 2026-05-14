import { useEffect, useState } from 'react'
import { Plus, X, TrendingDown, Target, Calendar, Flag, Trash2 } from 'lucide-react'
import { useBeautyStore } from '../stores/beautyStore'
import { today, formatDate } from '../utils/date'
import LineChart from '../components/features/LineChart'
import CelebrationModal from '../components/features/CelebrationModal'

const categoryLabels: Record<string, string> = {
  weight: '体重', skin: '皮肤', habit: '习惯', custom: '自定义',
}

export default function BeautyPage() {
  const {
    weightLogs, skinLogs, milestones, loadWeightLogs, loadSkinLogs,
    loadMilestones, addWeight, addSkinLog, addMilestone, updateMilestone,
    deleteMilestone, getBMI, settings, loadSettings,
  } = useBeautyStore()
  const [tab, setTab] = useState<'weight' | 'skin' | 'milestone'>('weight')

  // Weight form
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightVal, setWeightVal] = useState('')
  const [weightDate, setWeightDate] = useState(today())
  const [weightNote, setWeightNote] = useState('')

  // Skin form
  const [showSkinForm, setShowSkinForm] = useState(false)
  const [skinRedness, setSkinRedness] = useState(3)
  const [skinAcne, setSkinAcne] = useState(1)
  const [skinSat, setSkinSat] = useState(3)
  const [skinNote, setSkinNote] = useState('')

  // Milestone form
  const [showMsForm, setShowMsForm] = useState(false)
  const [msTitle, setMsTitle] = useState('')
  const [msCat, setMsCat] = useState<'weight' | 'skin' | 'habit' | 'custom'>('weight')
  const [msTarget, setMsTarget] = useState('')
  const [msDate, setMsDate] = useState('')

  // Celebration
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    loadWeightLogs(180)
    loadSkinLogs(180)
    loadMilestones()
    loadSettings()
  }, [])

  async function saveWeight() {
    const w = parseFloat(weightVal)
    if (!w || w < 30 || w > 200) return
    // Check for new low
    const prev = weightLogs.length > 0 ? Math.min(...weightLogs.map((l) => l.weight)) : null
    const isNewLow = prev != null && w < prev
    await addWeight({ date: weightDate, weight: w, note: weightNote || undefined })
    setShowWeightForm(false); setWeightVal(''); setWeightNote(''); setWeightDate(today())
    if (isNewLow) setCelebrate(true)
    // Check milestone achievements
    checkMilestoneAchieved()
  }

  async function saveSkin() {
    await addSkinLog({ date: today(), redness: skinRedness, acneLevel: skinAcne, satisfaction: skinSat, skincareUsed: [], note: skinNote || undefined })
    setShowSkinForm(false); setSkinNote('')
  }

  async function saveMilestone() {
    if (!msTitle.trim() || !msDate) return
    await addMilestone({ title: msTitle.trim(), category: msCat, targetValue: msTarget || msTitle, targetDate: msDate, achieved: false })
    setShowMsForm(false); setMsTitle(''); setMsTarget(''); setMsDate('')
  }

  async function checkMilestoneAchieved() {
    const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null
    for (const m of milestones) {
      if (m.achieved || m.category !== 'weight' || !currentWeight) continue
      const target = parseFloat(m.targetValue)
      if (!isNaN(target) && currentWeight <= target) {
        await updateMilestone(m.id!, { achieved: true, achievedDate: today() })
        setCelebrate(true)
      }
    }
  }

  async function markMilestoneDone(id: number) {
    await updateMilestone(id, { achieved: true, achievedDate: today() })
    setCelebrate(true)
  }

  const bmi = getBMI()
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null
  const minWeight = weightLogs.length > 0 ? Math.min(...weightLogs.map((l) => l.weight)) : null

  // BMI series
  const bmiSeries = settings['height'] && weightLogs.length >= 2
    ? [{
        label: 'BMI', color: '#C8956C',
        data: weightLogs.map((l) => {
          const hm = parseFloat(settings['height']) / 100
          return { date: l.date, value: Math.round((l.weight / (hm * hm)) * 10) / 10 }
        }),
        yMin: 18, yMax: 28,
      }]
    : []

  const chartSeries = [
    { label: '体重 (kg)', color: '#9CAF88', data: weightLogs.map((l) => ({ date: l.date, value: l.weight })) },
    ...bmiSeries,
  ]

  // Milestone mark dates for chart
  const markDates = milestones.filter((m) => m.achieved).map((m) => m.achievedDate!).filter(Boolean)

  // Gantt data
  const msDates = milestones.map((m) => m.targetDate).filter(Boolean).sort()
  const ganttMin = msDates[0] || today()
  const ganttMax = msDates[msDates.length - 1] || today()
  Math.max(7, Math.ceil((new Date(ganttMax).getTime() - new Date(ganttMin).getTime()) / 86400000) + 7)

  return (
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-2xl font-medium text-text mb-6">变美日记</h1>

      {/* Tabs */}
      <div className="flex bg-border/40 rounded-xl p-1 mb-5">
        {[{ key: 'weight', label: '体重' }, { key: 'skin', label: '皮肤' }, { key: 'milestone', label: '里程碑' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${tab === t.key ? 'bg-card text-text shadow-sm' : 'text-text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* === WEIGHT TAB === */}
      {tab === 'weight' && (
        <div>
          {currentWeight && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-card rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted mb-0.5">当前体重</p>
                <p className="text-xl font-medium text-text tnum">{currentWeight}<span className="text-xs text-text-muted font-normal">kg</span></p>
              </div>
              <div className="bg-card rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted mb-0.5">最低记录</p>
                <p className="text-xl font-medium text-success tnum">{minWeight}<span className="text-xs text-text-muted font-normal">kg</span></p>
              </div>
              <div className="bg-card rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted mb-0.5">BMI</p>
                <p className="text-xl font-medium text-text tnum">{bmi ?? '—'}{bmi && <span className="text-xs text-text-muted font-normal"> kg/m²</span>}</p>
              </div>
            </div>
          )}

          {chartSeries[0].data.length >= 2 ? (
            <div className="bg-card rounded-xl p-4 mb-5">
              <LineChart series={chartSeries} markDates={markDates} />
            </div>
          ) : (
            <div className="bg-card rounded-xl p-8 text-center mb-5">
              <TrendingDown size={32} className="text-border mx-auto mb-2" />
              <p className="text-text-muted text-sm">记录两次体重后将显示趋势图</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">历史记录</h2>
            <button onClick={() => setShowWeightForm(true)} className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center"><Plus size={16} /></button>
          </div>

          {weightLogs.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4">暂无记录</p>
          ) : (
            <div className="space-y-1.5">
              {[...weightLogs].reverse().map((log) => (
                <div key={log.id} className="bg-card rounded-xl p-3 flex items-center justify-between">
                  <div><p className="text-sm text-text">{formatDate(log.date)}</p>{log.note && <p className="text-xs text-text-muted">{log.note}</p>}</div>
                  <p className="text-[15px] font-medium text-text tnum">{log.weight} <span className="text-xs text-text-muted font-normal">kg</span></p>
                </div>
              ))}
            </div>
          )}

          {showWeightForm && (
            <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
              <div className="bg-card w-full max-w-[480px] rounded-t-2xl p-5">
                <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-medium text-text">记录体重</h2><button onClick={() => setShowWeightForm(false)} className="p-1"><X size={22} className="text-text-muted" /></button></div>
                <div className="mb-4"><label className="text-xs text-text-muted mb-1.5 block">日期</label><input type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text outline-none" /></div>
                <div className="mb-4"><label className="text-xs text-text-muted mb-1.5 block">体重 (kg)</label><input type="number" inputMode="decimal" value={weightVal} onChange={(e) => setWeightVal(e.target.value)} placeholder="如：58.5" step="0.1" className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none" /></div>
                <div className="mb-5"><input value={weightNote} onChange={(e) => setWeightNote(e.target.value)} placeholder="备注（可选）" className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none" /></div>
                <button onClick={saveWeight} className="w-full bg-accent text-white py-3 rounded-xl text-[15px] font-medium">保存</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === SKIN TAB === */}
      {tab === 'skin' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">皮肤记录</h2>
            <button onClick={() => setShowSkinForm(true)} className="w-7 h-7 rounded-full bg-accent-warm text-white flex items-center justify-center"><Plus size={16} /></button>
          </div>
          {skinLogs.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center"><p className="text-text-muted text-sm">记录你的皮肤状态</p></div>
          ) : (
            <div className="space-y-3">
              {skinLogs.map((log) => (
                <div key={log.id} className="bg-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3"><p className="text-sm text-text">{formatDate(log.date)}</p><p className="text-xs text-text-muted">满意度 {'⭐'.repeat(log.satisfaction)}</p></div>
                  <div className="flex gap-4 text-xs text-text-muted"><span>泛红: {'●'.repeat(log.redness)}{'○'.repeat(5-log.redness)}</span><span>痘痘: {['无','少量','中等','较多'][log.acneLevel]}</span></div>
                  {log.note && <p className="text-xs text-text-muted mt-2">{log.note}</p>}
                </div>
              ))}
            </div>
          )}
          {showSkinForm && (
            <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
              <div className="bg-card w-full max-w-[480px] rounded-t-2xl p-5 max-h-[80dvh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-medium text-text">皮肤记录</h2><button onClick={() => setShowSkinForm(false)} className="p-1"><X size={22} className="text-text-muted" /></button></div>
                <div className="mb-4"><label className="text-xs text-text-muted mb-2 block">泛红程度 (1-5)</label><div className="flex gap-2">{[1,2,3,4,5].map((v)=>(<button key={v} onClick={()=>setSkinRedness(v)} className={`flex-1 py-2.5 rounded-lg text-sm ${skinRedness===v?'bg-accent-warm text-white':'bg-border/30 text-text-muted'}`}>{v}</button>))}</div></div>
                <div className="mb-4"><label className="text-xs text-text-muted mb-2 block">痘痘</label><div className="flex gap-2">{[{v:0,l:'无'},{v:1,l:'少量'},{v:2,l:'中等'},{v:3,l:'较多'}].map(({v,l})=>(<button key={v} onClick={()=>setSkinAcne(v)} className={`flex-1 py-2.5 rounded-lg text-sm ${skinAcne===v?'bg-accent-warm text-white':'bg-border/30 text-text-muted'}`}>{l}</button>))}</div></div>
                <div className="mb-4"><label className="text-xs text-text-muted mb-2 block">整体满意度</label><div className="flex gap-3">{[1,2,3,4,5].map((v)=>(<button key={v} onClick={()=>setSkinSat(v)} className={`flex-1 py-2.5 rounded-lg text-lg ${skinSat===v?'bg-accent-warm/20 ring-1 ring-accent-warm':'bg-border/30'}`}>{v===1?'😞':v===3?'😐':v===5?'😊':''}</button>))}</div></div>
                <div className="mb-5"><input value={skinNote} onChange={(e)=>setSkinNote(e.target.value)} placeholder="备注（可选）" className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none" /></div>
                <button onClick={saveSkin} className="w-full bg-accent-warm text-white py-3 rounded-xl text-[15px] font-medium">保存记录</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === MILESTONE TAB === */}
      {tab === 'milestone' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">目标里程碑</h2>
            <button onClick={() => setShowMsForm(true)} className="w-7 h-7 rounded-full bg-reminder text-white flex items-center justify-center"><Plus size={16} /></button>
          </div>

          {/* Gantt chart */}
          {milestones.length > 0 && (
            <div className="bg-card rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-3"><Target size={16} className="text-reminder" /><span className="text-sm font-medium text-text">时间线</span></div>
              <div className="space-y-2">
                {milestones.sort((a, b) => a.targetDate.localeCompare(b.targetDate)).map((m) => {
                  const tStart = new Date(ganttMin).getTime()
                  const tEnd = new Date(ganttMax).getTime() + 7*86400000
                  const tRange = tEnd - tStart
                  const leftPct = Math.max(0, ((new Date(m.targetDate).getTime() - tStart) / tRange) * 100)
                  const overdue =!m.achieved && new Date(m.targetDate) < new Date()
                  return (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                        <span className="text-[10px] text-text-muted bg-border px-1 py-0.5 rounded">{categoryLabels[m.category]}</span>
                        <button onClick={() => deleteMilestone(m.id!)} className="text-text-muted"><Trash2 size={10} /></button>
                      </div>
                      <div className="flex-1 relative h-5">
                        <div className="absolute inset-y-0 rounded-full bg-border/40 w-full" />
                        <div className={`absolute inset-y-0 rounded-full left-0 h-full transition-all ${m.achieved ? 'bg-success' : overdue ? 'bg-reminder' : 'bg-accent'}`}
                          style={{ width: `${Math.max(2, (m.achieved ? 100 : Math.max(5, leftPct)))}%` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 shadow-sm"
                          style={{ left: `${Math.min(98, leftPct)}%`, borderColor: m.achieved ? '#6B8E5A' : overdue ? '#C8956C' : '#9CAF88' }} />
                      </div>
                      <span className="text-[10px] text-text-muted w-20 text-right">{m.targetDate.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Milestone list */}
          {milestones.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center">
              <Flag size={32} className="text-border mx-auto mb-2" />
              <p className="text-text-muted text-sm mb-1">还没有设置里程碑</p>
              <p className="text-text-muted text-xs">设定目标，让每一步都有方向</p>
              <button onClick={() => setShowMsForm(true)} className="mt-3 text-accent text-sm">+ 创建第一个里程碑</button>
            </div>
          ) : (
            <div className="space-y-2">
              {milestones.sort((a, b) => {
                if (a.achieved !== b.achieved) return a.achieved ? 1 : -1
                return a.targetDate.localeCompare(b.targetDate)
              }).map((m) => {
                const overdue = !m.achieved && new Date(m.targetDate) < new Date()
                return (
                  <div key={m.id} className={`bg-card rounded-xl p-4 ${m.achieved ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${m.achieved ? 'bg-success' : overdue ? 'bg-reminder' : 'bg-accent'}`} />
                        <span className="text-[15px] text-text font-medium">{m.title}</span>
                        <span className="text-[10px] text-text-muted bg-border px-1.5 py-0.5 rounded">{categoryLabels[m.category]}</span>
                      </div>
                      {!m.achieved && (
                        <button onClick={() => markMilestoneDone(m.id!)} className="text-xs text-accent border border-accent px-2 py-0.5 rounded-lg">达成</button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span><Calendar size={12} className="inline mr-1" />目标：{m.targetDate}</span>
                      <span>目标值：{m.targetValue}</span>
                      {m.achieved && <span className="text-success">✓ 已于 {m.achievedDate} 达成</span>}
                      {overdue && <span className="text-reminder">⚠ 已逾期</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add milestone modal */}
          {showMsForm && (
            <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
              <div className="bg-card w-full max-w-[480px] rounded-t-2xl p-5">
                <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-medium text-text">设定里程碑</h2><button onClick={() => setShowMsForm(false)} className="p-1"><X size={22} className="text-text-muted" /></button></div>
                <div className="mb-4"><label className="text-xs text-text-muted mb-1.5 block">目标名称</label><input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="如：体重降到57kg" className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none" /></div>
                <div className="mb-4"><label className="text-xs text-text-muted mb-1.5 block">类别</label><div className="flex gap-2">{(['weight','skin','habit','custom'] as const).map((c) => (<button key={c} onClick={() => setMsCat(c)} className={`flex-1 py-2 rounded-lg text-sm ${msCat===c?'bg-reminder text-white':'bg-border/30 text-text-muted'}`}>{categoryLabels[c]}</button>))}</div></div>
                <div className="mb-4"><label className="text-xs text-text-muted mb-1.5 block">目标值</label><input value={msTarget} onChange={(e) => setMsTarget(e.target.value)} placeholder="如：57 (kg)" className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text placeholder:text-text-muted/50 outline-none" /></div>
                <div className="mb-5"><label className="text-xs text-text-muted mb-1.5 block">目标日期</label><input type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} className="w-full bg-border/30 rounded-lg px-3 py-2.5 text-[15px] text-text outline-none" /></div>
                <button onClick={saveMilestone} disabled={!msTitle.trim()||!msDate} className="w-full bg-reminder text-white py-3 rounded-xl text-[15px] font-medium disabled:opacity-40">创建里程碑</button>
              </div>
            </div>
          )}
        </div>
      )}

      <CelebrationModal show={celebrate} onClose={() => setCelebrate(false)} />
    </div>
  )
}
