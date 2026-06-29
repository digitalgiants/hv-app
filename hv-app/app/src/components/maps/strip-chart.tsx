'use client'

import { useState, useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import type { PPHorse, PastStart } from '@/types/racing'

// ── Types ─────────────────────────────────────────────────────────────────────

type Metric = 'speed' | 'ep' | 'lp' | 'pp' | 'mph'

export interface RankedHorse {
  horse: PPHorse
  rank: number  // 1 = lowest PP, N = highest PP
}

interface Props {
  rankedHorses: RankedHorse[]
  speedPar?: number | null
}

interface ChartPoint {
  x: number
  y: number
  recencyIndex: number
  totalPoints: number
  horseName: string
  primePower?: number
  morningLine?: number
  trainer?: string
  jockey?: string
  date?: string
  track?: string
  raceClass?: string
  finish?: number
  metricLabel: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeMPH(start: PastStart): number | null {
  const finalSec = start.fractions?.final
  if (!finalSec || !start.distance || finalSec <= 0) return null
  return Math.round((start.distance / 1760) / (finalSec / 3600) * 10) / 10
}

function getMetricValue(start: PastStart, metric: Metric): number | null {
  switch (metric) {
    case 'speed': return start.speedFigure ?? null
    case 'ep':    return start.earlyPaceFigure ?? null
    case 'lp':    return start.latePaceFigure  ?? null
    case 'mph':   return computeMPH(start)
    default:      return null
  }
}

const METRIC_LABEL: Record<Metric, string> = {
  speed: 'BRIS Speed',
  ep:    'Early Pace',
  lp:    'Late Pace',
  pp:    'Prime Power',
  mph:   'MPH',
}

function buildPoints(horse: PPHorse, rank: number, metric: Metric): ChartPoint[] {
  const label = METRIC_LABEL[metric]

  if (metric === 'pp') {
    if (!horse.primePower) return []
    return [{
      x: horse.primePower,
      y: rank,
      recencyIndex: 0,
      totalPoints: 1,
      horseName: horse.name,
      primePower: horse.primePower,
      morningLine: horse.morningLine,
      trainer: horse.trainer,
      jockey: horse.jockey,
      metricLabel: label,
    }]
  }

  const filtered = horse.pastStarts
    .map((s, i) => ({ s, i, val: getMetricValue(s, metric) }))
    .filter(({ val }) => val != null)

  return filtered.map(({ s, i, val }) => ({
    x: val!,
    y: rank,
    recencyIndex: i,            // 0 = most recent
    totalPoints: horse.pastStarts.length,
    horseName: horse.name,
    primePower: horse.primePower,
    morningLine: horse.morningLine,
    trainer: horse.trainer,
    jockey: horse.jockey,
    date: s.date,
    track: s.track,
    raceClass: s.raceType,
    finish: s.finish,
    metricLabel: label,
  }))
}

// Interpolate from bright sky (most recent) to slate (oldest)
function recencyColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1)
  const sat = Math.round(80 - 60 * t)
  const lig = Math.round(62 - 22 * t)
  return `hsl(210, ${sat}%, ${lig}%)`
}

function mlStr(ml: number | undefined): string {
  if (!ml || ml <= 0) return '—'
  if (ml < 1) return `${Math.round(1 / ml)}/5`
  if (ml === 1) return '1/1'
  if (ml % 1 === 0.5) return `${Math.round(ml * 2)}/2`
  return `${Math.round(ml)}/1`
}

// ── Custom Y-axis tick ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeYTick(rankedHorses: RankedHorse[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function YTick(props: any) {
    const { x, y, payload } = props
    const rh = rankedHorses.find(r => r.rank === payload?.value)
    if (!rh) return null

    const postStr = `${rh.horse.postPosition}. `
    const maxName = 13 - postStr.length
    const name = rh.horse.name.length > maxName
      ? rh.horse.name.slice(0, maxName - 1) + '…'
      : rh.horse.name

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-6}
          y={0}
          dy={4}
          textAnchor="end"
          fill="#94a3b8"
          fontSize={10}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          {postStr}{name}
        </text>
      </g>
    )
  }
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ChartPoint
  if (!d) return null

  return (
    <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs shadow-xl max-w-[200px] space-y-1">
      <p className="text-white font-semibold truncate">{d.horseName}</p>
      <div className="flex gap-3 text-slate-400">
        {d.primePower != null && <span>PP {d.primePower.toFixed(1)}</span>}
        {d.morningLine != null && <span>{mlStr(d.morningLine)} ML</span>}
      </div>
      {(d.trainer || d.jockey) && (
        <p className="text-slate-500 text-[10px]">
          {[
            d.trainer ? `T: ${d.trainer}` : null,
            d.jockey  ? `J: ${d.jockey}`  : null,
          ].filter(Boolean).join(' / ')}
        </p>
      )}
      {d.date && (
        <div className="border-t border-slate-800 pt-1.5 mt-0.5 space-y-0.5">
          <p className="text-slate-400">{d.date}{d.track ? ` · ${d.track}` : ''}</p>
          {d.raceClass && (
            <p className="text-slate-500 text-[10px] truncate">{d.raceClass}</p>
          )}
          <p className="text-sky-400 font-mono">
            {d.metricLabel}: {d.x}
          </p>
          {d.finish != null && (
            <p className={`font-medium ${
              d.finish === 1 ? 'text-emerald-400' :
              d.finish <= 3  ? 'text-sky-400' :
              'text-slate-400'
            }`}>
              Finished {d.finish}
            </p>
          )}
        </div>
      )}
      <p className="text-slate-600 text-[9px]">
        {d.recencyIndex === 0 ? 'Most recent' : `${d.recencyIndex} race${d.recencyIndex === 1 ? '' : 's'} ago`}
      </p>
    </div>
  )
}

// ── Custom dot shape ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RecencyDot(props: any) {
  const { cx, cy, payload } = props
  if (typeof cx !== 'number' || typeof cy !== 'number') return <g />
  const color = recencyColor(payload?.recencyIndex ?? 0, payload?.totalPoints ?? 1)
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      fillOpacity={0.9}
      stroke={color}
      strokeWidth={0}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const METRICS: { key: Metric; label: string }[] = [
  { key: 'speed', label: 'Speed' },
  { key: 'ep',    label: 'EP' },
  { key: 'lp',    label: 'LP' },
  { key: 'pp',    label: 'Prime Power' },
  { key: 'mph',   label: 'MPH' },
]

export function StripChart({ rankedHorses, speedPar }: Props) {
  const [metric, setMetric]   = useState<Metric>('speed')
  const [showPar, setShowPar] = useState(false)

  const N = rankedHorses.length
  const chartHeight = Math.max(260, N * 44 + 60)
  const ranks = rankedHorses.map(rh => rh.rank)

  const allPoints = useMemo(
    () => rankedHorses.flatMap(({ horse, rank }) => buildPoints(horse, rank, metric)),
    [rankedHorses, metric],
  )

  // Memoize the tick component so it doesn't re-create on every render
  const YTick = useMemo(() => makeYTick(rankedHorses), [rankedHorses])

  const hasData = allPoints.length > 0
  const currentLabel = METRICS.find(m => m.key === metric)?.label ?? ''

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {/* Metric switcher */}
        <div className="flex flex-wrap gap-1">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                metric === m.key
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Class par toggle */}
        {speedPar != null && (
          <button
            onClick={() => setShowPar(p => !p)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
              showPar
                ? 'bg-red-900/50 text-red-300 border border-red-700/60'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Par {speedPar}
          </button>
        )}
      </div>

      {/* Chart or empty state */}
      {!hasData ? (
        <div className="text-slate-500 text-sm text-center py-10">
          No {currentLabel} data for this field.
          Re-import this card to populate figures.
        </div>
      ) : (
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 28, left: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={true}
                horizontal={false}
              />
              <XAxis
                type="number"
                dataKey="x"
                domain={['auto', 'auto']}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={{ stroke: '#334155' }}
                axisLine={{ stroke: '#334155' }}
                label={{
                  value: currentLabel,
                  position: 'insideBottom',
                  offset: -14,
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0.5, N + 0.5]}
                ticks={ranks}
                tick={YTick}
                width={100}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
              />
              {showPar && speedPar != null && (
                <ReferenceLine
                  x={speedPar}
                  stroke="#ef4444"
                  strokeDasharray="4 2"
                  strokeWidth={1.5}
                  label={{
                    value: `Par ${speedPar}`,
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 9,
                  }}
                />
              )}
              <Scatter
                data={allPoints}
                shape={<RecencyDot />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recency legend */}
      {hasData && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 px-1">
          <span>Dot color →</span>
          <span style={{ color: recencyColor(0, 5) }}>● most recent</span>
          <span style={{ color: recencyColor(4, 5) }}>● oldest</span>
          {showPar && speedPar != null && (
            <span className="text-red-400 ml-1">— class par ({speedPar})</span>
          )}
        </div>
      )}
    </div>
  )
}
