'use client'

import type { PPHorse } from '@/types/racing'

interface Props {
  horses: PPHorse[]
}

function mlDecimal(ml: number | undefined): number {
  if (!ml || ml <= 0) return 99
  return ml
}

export function BetSuggestions({ horses }: Props) {
  const withPP = horses.filter(h => h.primePower && h.primePower > 0)
  if (withPP.length === 0) return null

  const ppSum = withPP.reduce((s, h) => s + (h.primePower ?? 0), 0)

  const rows = horses
    .map(h => {
      const pp = h.primePower ?? 0
      const ppProb = ppSum > 0 && pp > 0 ? pp / ppSum : 0
      const mlProb = 1 / (mlDecimal(h.morningLine) + 1)
      const diff   = ppProb - mlProb
      return { horse: h, ppProb, mlProb, diff }
    })
    .filter(r => r.diff > 0.04)
    .sort((a, b) => b.diff - a.diff)

  if (rows.length === 0) {
    return (
      <div className="text-slate-600 text-sm text-center py-3">
        No significant value edges (PP – ML &gt; 4%) found in this field.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rows.map(({ horse, ppProb, diff }) => {
        const tier = diff >= 0.12 ? 'Strong' : diff >= 0.08 ? 'Moderate' : 'Slight'
        const tierColor = diff >= 0.12 ? 'text-emerald-300 bg-emerald-900/60 border-emerald-700'
          : diff >= 0.08 ? 'text-sky-300 bg-sky-900/50 border-sky-800'
          : 'text-yellow-300 bg-yellow-900/30 border-yellow-800/50'
        const fairWinPct = (ppProb * 100).toFixed(1)
        const expectedValue = (ppProb * (mlDecimal(horse.morningLine) + 1) - 1)

        return (
          <div
            key={horse.programNumber}
            className={`flex items-start gap-4 p-3 rounded-lg border ${tierColor}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{horse.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{tier}</span>
              </div>
              <p className="text-[11px] opacity-70 mt-0.5">
                PP win probability {fairWinPct}% · +{(diff * 100).toFixed(1)}% edge vs M/L
                {expectedValue > 0 && ` · EV +${(expectedValue * 100).toFixed(0)}¢/$1`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] opacity-60 uppercase tracking-wide">Suggestion</p>
              <p className="text-sm font-bold">Win / E/W</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
