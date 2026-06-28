'use client'

import type { PPHorse } from '@/types/racing'

interface Props {
  horses: PPHorse[]
}

function toFractional(decimalOdds: number): string {
  // Round to nearest common track odds
  const common = [0.2, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.4, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30, 50, 99]
  const nearest = common.reduce((a, b) => Math.abs(b - decimalOdds) < Math.abs(a - decimalOdds) ? b : a)
  if (nearest < 1) return `${Math.round(nearest * 5)}/5`
  if (nearest === 1) return '1/1'
  if (nearest % 1 === 0.5) return `${Math.round(nearest * 2)}/2`
  return `${Math.round(nearest)}/1`
}

function mlDecimal(ml: number | undefined): number {
  if (!ml || ml <= 0) return 99
  return ml
}

function mlImpliedProb(ml: number | undefined): number {
  const dec = mlDecimal(ml)
  return 1 / (dec + 1)
}

export function OddsTable({ horses }: Props) {
  const withPP = horses.filter(h => h.primePower && h.primePower > 0)
  const ppSum  = withPP.reduce((s, h) => s + (h.primePower ?? 0), 0)

  if (withPP.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-8">
        Re-import this race card to populate BRIS Prime Power ratings.
      </div>
    )
  }

  const rows = horses.map(h => {
    const pp = h.primePower ?? 0
    const ppProb   = ppSum > 0 && pp > 0 ? pp / ppSum : null
    const fairOdds = ppProb ? (1 / ppProb) - 1 : null
    const mlProb   = mlImpliedProb(h.morningLine)
    const diff     = ppProb != null ? ppProb - mlProb : null
    return { horse: h, pp, ppProb, fairOdds, mlProb, diff }
  })

  // Sort by PP descending
  const sorted = [...rows].sort((a, b) => b.pp - a.pp)
  const maxDiff = Math.max(...rows.map(r => Math.abs(r.diff ?? 0)), 0.01)

  return (
    <div className="space-y-2">
      {/* Header */}
      <div
        className="grid gap-x-3 text-[10px] uppercase tracking-widest text-slate-600 pb-1.5 border-b border-slate-800"
        style={{ gridTemplateColumns: '24px 1fr 60px 80px 80px 80px 1fr' }}
      >
        <span>#</span>
        <span>Horse</span>
        <span>PP Rtg</span>
        <span>M/L</span>
        <span>Fair Odds</span>
        <span>Diff</span>
        <span>Value</span>
      </div>

      {sorted.map(({ horse, pp, ppProb, fairOdds, diff }) => {
        const ml = horse.morningLine
        const mlStr = ml != null
          ? ml < 1 ? `${Math.round(1 / ml)}/5` : ml === 1 ? '1/1' : `${ml % 1 === 0.5 ? `${Math.round(ml * 2)}/2` : `${Math.round(ml)}/1`}`
          : '—'
        const fairStr = fairOdds != null ? toFractional(fairOdds) : '—'
        const diffPct = diff != null ? diff * 100 : null
        const isValue = diff != null && diff > 0.04
        const isLay   = diff != null && diff < -0.04

        return (
          <div
            key={horse.programNumber}
            className={`grid gap-x-3 items-center py-2 rounded-lg px-2 transition-colors
              ${isValue ? 'bg-emerald-950/40 border border-emerald-900/50' : isLay ? 'bg-red-950/20' : ''}`}
            style={{ gridTemplateColumns: '24px 1fr 60px 80px 80px 80px 1fr' }}
          >
            <span className="text-slate-600 text-xs font-mono">{horse.postPosition}</span>
            <span className={`text-sm font-medium truncate ${isValue ? 'text-white' : 'text-slate-300'}`}>
              {horse.name}
            </span>
            <span className="text-slate-400 font-mono text-xs">{pp > 0 ? pp.toFixed(1) : '—'}</span>
            <span className="text-yellow-400 font-mono text-xs">{mlStr}</span>
            <span className="text-sky-400 font-mono text-xs">{fairStr}</span>
            <span className={`font-mono text-xs font-semibold ${
              diffPct == null ? 'text-slate-600' :
              diffPct > 4  ? 'text-emerald-400' :
              diffPct < -4 ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {diffPct != null ? `${diffPct > 0 ? '+' : ''}${diffPct.toFixed(1)}%` : '—'}
            </span>
            <span className="text-xs">
              {isValue && (
                <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                  VALUE
                </span>
              )}
              {isLay && (
                <span className="bg-red-900/40 text-red-400 px-2 py-0.5 rounded text-[10px]">
                  LAY
                </span>
              )}
            </span>
          </div>
        )
      })}

      <div className="pt-3 text-[10px] text-slate-600 space-y-0.5">
        <p>Fair Odds = Prime Power normalized to win probability, converted to fractional.</p>
        <p>Diff = PP implied win% minus M/L implied win%. Green = PP favors horse over M/L.</p>
      </div>
    </div>
  )
}
