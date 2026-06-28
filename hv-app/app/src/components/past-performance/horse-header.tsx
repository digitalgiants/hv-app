'use client'

import type { PPHorse } from '@/types/racing'
import { StatsDrawer } from '@/components/trainer-jockey/stats-drawer'

interface Props {
  horse: PPHorse
}

function statBlock(label: string, stats: { starts: number; wins: number; places: number; shows: number; earnings: number }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs text-slate-300 font-mono">
        {stats.starts}-{stats.wins}-{stats.places}-{stats.shows}
      </div>
      <div className="text-[10px] text-slate-500">
        ${stats.earnings.toLocaleString()}
      </div>
    </div>
  )
}

function sexLabel(sex: string): string {
  const map: Record<string, string> = {
    H: 'Horse', G: 'Gelding', M: 'Mare', F: 'Filly', C: 'Colt', R: 'Ridgling',
  }
  return map[sex] ?? sex
}

function colorLabel(color: string): string {
  const map: Record<string, string> = {
    B: 'Bay', CH: 'Chestnut', GR: 'Gray', 'GR/RO': 'Gray/Roan',
    'DK B/BR': 'Dk Bay/Br', RO: 'Roan', WH: 'White',
  }
  return map[color] ?? color
}

export function HorseHeader({ horse }: Props) {
  const mlDisplay = horse.morningLine
    ? horse.morningLine < 1
      ? `${Math.round(1 / horse.morningLine)}/1`
      : horse.morningLine === 1
        ? '1/1'
        : `${horse.morningLine}/1`
    : '—'

  return (
    <div className="space-y-2">
      {/* Top row: post, name, weight, ML, prime power */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
          {horse.postPosition}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="text-lg font-bold text-white tracking-wide">{horse.name}</h2>
            <span className="text-slate-400 text-sm">{horse.weightLbs} lbs</span>
            <span className="text-yellow-400 text-sm font-semibold">{mlDisplay} ML</span>
            {horse.primePower != null && (
              <span className="text-xs font-bold bg-sky-900/60 text-sky-300 px-2 py-0.5 rounded-full">
                PP {horse.primePower.toFixed(1)}
              </span>
            )}
            {horse.speedParForClass != null && (
              <span className="text-xs text-slate-500">
                Par {horse.speedParForClass}
              </span>
            )}
            {horse.daysSinceLastRace != null && (
              <span className="text-xs text-slate-400">
                {horse.daysSinceLastRace}d off
              </span>
            )}
          </div>
          {/* Breeding line */}
          <p className="text-xs text-slate-500 mt-0.5">
            {colorLabel(horse.color)} {sexLabel(horse.sex)}, {horse.age}yo &mdash;{' '}
            {horse.sire ?? '—'} – {horse.dam ?? '—'} ({horse.damSire ?? '—'})
          </p>
        </div>
      </div>

      {/* Trainer / Jockey / Owner */}
      <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs pl-10">
        <span>
          <span className="text-slate-500">Trainer: </span>
          {horse.trainer ? (
            <StatsDrawer role="Trainer" name={horse.trainer} stats={horse.trainerStats} catStats={horse.trainerCatStats} />
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </span>
        <span>
          <span className="text-slate-500">Jockey: </span>
          {horse.jockey ? (
            <StatsDrawer role="Jockey" name={horse.jockey} stats={horse.jockeyStats} />
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </span>
        <span>
          <span className="text-slate-500">Owner: </span>
          <span className="text-slate-400">{horse.owner ?? '—'}</span>
        </span>
      </div>

      {/* Career stats + splits */}
      <div className="pl-10 flex flex-wrap gap-6">
        {statBlock('Lifetime', horse.lifetime)}
        {statBlock('Curr Yr', horse.currentYear)}
        {statBlock('Prev Yr', horse.previousYear)}
        {horse.distStats  && statBlock('At Dist', horse.distStats)}
        {horse.trackStats && statBlock('At Trk', horse.trackStats)}
        {horse.turf       && statBlock('Turf', horse.turf)}
        {horse.offTrack   && statBlock('Off Trk', horse.offTrack)}
      </div>

      {/* Best BRIS Speed summary */}
      {(horse.bestSpeedFastTrack || horse.bestSpeedOffTrack || horse.bestSpeedTurf || horse.bestSpeedDistance) && (
        <div className="pl-10 flex flex-wrap gap-4 text-[10px]">
          <span className="text-slate-500 uppercase tracking-wide">Best Spd:</span>
          {!!horse.bestSpeedFastTrack && (
            <span><span className="text-slate-500">Fast </span><span className="text-slate-300 font-mono">{horse.bestSpeedFastTrack}</span></span>
          )}
          {!!horse.bestSpeedOffTrack && (
            <span><span className="text-slate-500">Off </span><span className="text-slate-300 font-mono">{horse.bestSpeedOffTrack}</span></span>
          )}
          {!!horse.bestSpeedTurf && (
            <span><span className="text-slate-500">Turf </span><span className="text-emerald-400 font-mono">{horse.bestSpeedTurf}</span></span>
          )}
          {!!horse.bestSpeedDistance && (
            <span><span className="text-slate-500">Dist </span><span className="text-sky-400 font-mono">{horse.bestSpeedDistance}</span></span>
          )}
        </div>
      )}
    </div>
  )
}
