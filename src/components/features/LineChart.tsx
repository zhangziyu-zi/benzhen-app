interface DataSeries {
  label: string
  color: string
  data: { date: string; value: number }[]
  yMin?: number
  yMax?: number
}

interface Props {
  series: DataSeries[]
  width?: number
  height?: number
  markDates?: string[] // dates to highlight with dots
}

export default function LineChart({ series, width = 320, height = 180, markDates }: Props) {
  const padL = 40
  const padR = 16
  const padT = 16
  const padB = 28
  const plotW = width - padL - padR
  const plotH = height - padT - padB

  // Compute global y range
  let globalMin = Infinity
  let globalMax = -Infinity
  for (const s of series) {
    const vals = s.data.map((d) => d.value)
    const smin = s.yMin ?? Math.min(...vals)
    const smax = s.yMax ?? Math.max(...vals)
    if (smin < globalMin) globalMin = smin
    if (smax > globalMax) globalMax = smax
  }
  const range = globalMax - globalMin || 1
  const yMin = globalMin - range * 0.1
  const yMax = globalMax + range * 0.1
  const yRange = yMax - yMin

  // Get all unique dates sorted
  const allDates = [...new Set(series.flatMap((s) => s.data.map((d) => d.date)))].sort()

  function toX(date: string) {
    if (allDates.length <= 1) return padL + plotW / 2
    const idx = allDates.indexOf(date)
    return padL + (idx / (allDates.length - 1)) * plotW
  }

  function toY(value: number) {
    return padT + (1 - (value - yMin) / yRange) * plotH
  }

  // Y-axis ticks (4 ticks)
  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const v = yMin + (yRange * i) / 3
    return { value: v, y: toY(v) }
  })

  // X-axis labels (at most 6)
  const xLabels: { date: string; x: number }[] = []
  const step = Math.max(1, Math.ceil(allDates.length / 6))
  for (let i = 0; i < allDates.length; i += step) {
    xLabels.push({ date: allDates[i], x: toX(allDates[i]) })
  }
  // Always include last
  if (allDates.length > 1 && xLabels[xLabels.length - 1]?.date !== allDates[allDates.length - 1]) {
    xLabels.push({ date: allDates[allDates.length - 1], x: toX(allDates[allDates.length - 1]) })
  }

  const markSet = new Set(markDates)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t.value}>
          <line
            x1={padL}
            y1={t.y}
            x2={padL + plotW}
            y2={t.y}
            stroke="#E8E3DB"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          <text
            x={padL - 6}
            y={t.y + 4}
            textAnchor="end"
            className="text-[10px]"
            fill="#8B7E6A"
          >
            {t.value.toFixed(1)}
          </text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.map((l) => (
        <text
          key={l.date}
          x={l.x}
          y={height - 4}
          textAnchor="middle"
          className="text-[10px]"
          fill="#8B7E6A"
        >
          {l.date.slice(5)}
        </text>
      ))}

      {/* Lines */}
      {series.map((s, _) => {
        if (s.data.length < 2) return null
        const points = s.data
          .map((d) => `${toX(d.date)},${toY(d.value)}`)
          .join(' ')
        return (
          <g key={s.label}>
            <polyline
              points={points}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots */}
            {s.data.map((d, i) => {
              const isMark = markSet.has(d.date)
              return (
                <circle
                  key={i}
                  cx={toX(d.date)}
                  cy={toY(d.value)}
                  r={isMark ? 4 : i === s.data.length - 1 ? 3 : 0}
                  fill={isMark ? s.color : '#FFFFFF'}
                  stroke={s.color}
                  strokeWidth="1.5"
                />
              )
            })}
          </g>
        )
      })}

      {/* Legend */}
      {series.length > 1 && (
        <g transform={`translate(${padL}, 4)`}>
          {series.map((s, i) => (
            <g key={s.label} transform={`translate(${i * 80}, 0)`}>
              <line x1={0} y1={8} x2={16} y2={8} stroke={s.color} strokeWidth="2" />
              <text x={20} y={12} className="text-[10px]" fill="#8B7E6A">
                {s.label}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
