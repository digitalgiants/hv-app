'use client'

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts'
import type { PastStart } from '@/types/racing'

interface Props {
  pastStarts: PastStart[]
}

function figureColor(val: number | null | undefined): string {
  if (!val) return '#475569'
  if (val >= 90) return '#34d399'
  if (val >= 80) return '#38bdf8'
  if (val >= 70) return '#facc15'
  if (val >= 60) return '#fb923c'
  return '#f87171'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ColoredDot(props: any) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  const color = figureColor(payload.fig)
  return <Dot cx={cx} cy={cy} r={4} fill={color} stroke={color} />
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs space-y-0.5">
      <p className="text-slate-400">{d?.date}</p>
      {d?.fig != null && <p className="text-sky-400">Spd: <span className="font-mono">{d.fig}</span></p>}
      {d?.ep  != null && <p className="text-yellow-400">EP: <span className="font-mono">{d.ep}</span></p>}
      {d?.mp  != null && <p className="text-green-400">MP: <span className="font-mono">{d.mp}</span></p>}
      {d?.lp  != null && <p className="text-purple-400">LP: <span className="font-mono">{d.lp}</span></p>}
    </div>
  )
}

export function SpeedFigureChart({ pastStarts }: Props) {
  const hasEP = pastStarts.some(s => s.earlyPaceFigure  != null)
  const hasMP = pastStarts.some(s => s.middlePaceFigure != null)
  const hasLP = pastStarts.some(s => s.latePaceFigure   != null)

  const data = [...pastStarts]
    .reverse()
    .map((s, i) => ({
      race: i + 1,
      date: s.date,
      fig:  s.speedFigure       ?? null,
      ep:   s.earlyPaceFigure   ?? null,
      mp:   s.middlePaceFigure  ?? null,
      lp:   s.latePaceFigure    ?? null,
    }))

  return (
    <div className="space-y-1">
      {(hasEP || hasMP || hasLP) && (
        <div className="flex gap-4 text-[10px] text-slate-500">
          <span><span className="inline-block w-2 h-2 rounded-full bg-sky-500 mr-1" />Speed</span>
          {hasEP && <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />EP</span>}
          {hasMP && <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />MP</span>}
          {hasLP && <span><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1" />LP</span>}
        </div>
      )}
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="race" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={80} stroke="#1e293b" strokeDasharray="3 3" />

            {/* Speed figure */}
            <Line
              type="monotone"
              dataKey="fig"
              stroke="#334155"
              strokeWidth={1.5}
              dot={<ColoredDot />}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />

            {/* Early Pace */}
            {hasEP && (
              <Line
                type="monotone"
                dataKey="ep"
                stroke="#eab308"
                strokeWidth={1}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 3, fill: '#eab308' }}
                connectNulls={false}
              />
            )}

            {/* Middle Pace */}
            {hasMP && (
              <Line
                type="monotone"
                dataKey="mp"
                stroke="#22c55e"
                strokeWidth={1}
                strokeDasharray="3 2"
                dot={false}
                activeDot={{ r: 3, fill: '#22c55e' }}
                connectNulls={false}
              />
            )}

            {/* Late Pace */}
            {hasLP && (
              <Line
                type="monotone"
                dataKey="lp"
                stroke="#a855f7"
                strokeWidth={1}
                strokeDasharray="2 3"
                dot={false}
                activeDot={{ r: 3, fill: '#a855f7' }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
