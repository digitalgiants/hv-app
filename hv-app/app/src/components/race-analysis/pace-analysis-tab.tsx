'use client'

import type { PPHorse, PastStart } from '@/types/racing'

interface Props {
  horses: PPHorse[]
}

function avg(nums: number[]): number | null {
  const valid = nums.filter(n => n > 0)
  if (!valid.length) return null
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

function paceProfile(starts: PastStart[]): { ep: number | null; mp: number | null; lp: number | null; fig: number | null } {
  const last5 = starts.slice(0, 5)
  return {
    ep:  avg(last5.map(s => s.earlyPaceFigure  ?? 0)),
    mp:  avg(last5.map(s => s.middlePaceFigure ?? 0)),
    lp:  avg(last5.map(s => s.latePaceFigure   ?? 0)),
    fig: avg(last5.map(s => s.speedFigure       ?? 0)),
  }
}

function paceType(ep: number | null, lp: number | null): { label: string; color: string } {
  if (ep == null || lp == null) return { label: 'Unknown', color: 'text-slate-500' }
  const diff = ep - lp
  if (diff > 10) return { label: 'Early speed',  color: 'text-yellow-400' }
  if (diff > 4)  return { label: 'Pace presser', color: 'text-orange-400' }
  if (diff < -4) return { label: 'Closer',       color: 'text-purple-400' }
  return { label: 'Versatile', color: 'text-sky-400' }
}

function paceBar(val: number | null, max: number, color: string) {
  if (val == null) return null
  const pct = max > 0 ? Math.min((val / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-300 font-mono text-xs w-7 text-right">{val}</span>
      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// Count horses likely to be on pace (high EP relative to field)
function paceScenario(profiles: { ep: number | null; lp: number | null }[]): string {
  const validEp = profiles.map(p => p.ep).filter((e): e is number => e != null)
  if (validEp.length < 2) return 'Insufficient data'
  const sorted = [...validEp].sort((a, b) => b - a)
  const topEp  = sorted[0]
  const threshold = topEp - 5
  const speedHorses = validEp.filter(e => e >= threshold).length
  if (speedHorses === 1) return 'Lone speed — possible wire-to-wire'
  if (speedHorses === 2) return 'Two-way pace duel likely'
  return `${speedHorses} horses fighting for early lead — pace collapse possible`
}

export function PaceAnalysisTab({ horses }: Props) {
  const profiles = horses.map(h => ({ horse: h, ...paceProfile(h.pastStarts) }))
  const maxEp = Math.max(...profiles.map(p => p.ep ?? 0), 1)
  const maxMp = Math.max(...profiles.map(p => p.mp ?? 0), 1)
  const maxLp = Math.max(...profiles.map(p => p.lp ?? 0), 1)
  const hasMP = profiles.some(p => p.mp != null)

  const scenario = paceScenario(profiles.map(p => ({ ep: p.ep, lp: p.lp })))

  return (
    <div className="space-y-4">
      {/* Scenario callout */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Pace Scenario</p>
        <p className="text-slate-200 text-sm">{scenario}</p>
        <p className="text-slate-500 text-xs mt-1">
          Based on avg EP of last 5 starts. EP/MP/LP = normalized pace scores (100 = par).
        </p>
      </div>

      {/* Horse pace table */}
      <div className="space-y-2">
        <div
          className="grid text-[10px] uppercase tracking-widest text-slate-600 pb-1 border-b border-slate-800"
          style={{ gridTemplateColumns: hasMP ? '24px 1fr 110px 110px 110px 80px 80px' : '24px 1fr 120px 120px 80px 80px' }}
        >
          <span />
          <span>Horse</span>
          <span>Avg EP (last 5)</span>
          {hasMP && <span>Avg MP (last 5)</span>}
          <span>Avg LP (last 5)</span>
          <span>Avg Spd</span>
          <span>Type</span>
        </div>

        {profiles
          .sort((a, b) => (b.ep ?? 0) - (a.ep ?? 0))
          .map(({ horse, ep, mp, lp, fig }) => {
            const { label, color } = paceType(ep, lp)
            return (
              <div
                key={horse.programNumber}
                className="grid items-center gap-x-3 py-2 border-b border-slate-800/50"
                style={{ gridTemplateColumns: hasMP ? '24px 1fr 110px 110px 110px 80px 80px' : '24px 1fr 120px 120px 80px 80px' }}
              >
                <span className="text-slate-600 text-xs font-mono">{horse.postPosition}</span>
                <span className="text-slate-200 text-xs font-medium truncate">{horse.name}</span>
                <div>{paceBar(ep, maxEp, 'bg-yellow-500')}</div>
                {hasMP && <div>{paceBar(mp, maxMp, 'bg-green-500')}</div>}
                <div>{paceBar(lp, maxLp, 'bg-purple-500')}</div>
                <span className="text-slate-400 font-mono text-xs">{fig ?? '—'}</span>
                <span className={`text-xs ${color}`}>{label}</span>
              </div>
            )
          })}
      </div>

      {/* Key */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2">
        <span><span className="text-yellow-400">EP</span> = avg speed to half-mile</span>
        {hasMP && <span><span className="text-green-400">MP</span> = avg speed quarter-to-half</span>}
        <span><span className="text-purple-400">LP</span> = avg speed half to finish</span>
        <span>100 = par</span>
      </div>
    </div>
  )
}
