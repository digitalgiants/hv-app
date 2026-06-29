'use client'

import { useState } from 'react'
import type { PPHorse } from '@/types/racing'

interface RankedHorse {
  horse: PPHorse
  rank: number
}

interface Props {
  horses: RankedHorse[]
}

function mlStr(ml: number | undefined): string {
  if (!ml || ml <= 0) return '—'
  if (ml < 1) return `${Math.round(1 / ml)}/5`
  if (ml === 1) return '1/1'
  if (ml % 1 === 0.5) return `${Math.round(ml * 2)}/2`
  return `${Math.round(ml)}/1`
}

export function FieldSummary({ horses }: Props) {
  const [open, setOpen] = useState(false)

  // Highest rank first = top of chart first
  const sorted = [...horses].sort((a, b) => b.rank - a.rank)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs hover:bg-slate-800/40 transition-colors"
      >
        <span className="uppercase tracking-widest font-medium text-slate-400">
          Field · {horses.length} horses · sorted by Prime Power ↓
        </span>
        <span className="text-slate-500 ml-3 flex-shrink-0">
          {open ? '▲ hide' : '▼ show'}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-800">
          {/* Column headers */}
          <div
            className="grid gap-x-2 px-4 py-1.5 text-[10px] uppercase tracking-widest text-slate-600 border-b border-slate-800/60"
            style={{ gridTemplateColumns: '22px 22px 1fr 46px 42px 1fr' }}
          >
            <span>Rnk</span>
            <span>#</span>
            <span>Horse</span>
            <span>PP Rtg</span>
            <span>M/L</span>
            <span>Trainer / Jockey</span>
          </div>

          {sorted.map(({ horse, rank }) => (
            <div
              key={horse.programNumber}
              className="grid gap-x-2 px-4 py-2 border-b border-slate-800/30 last:border-0 items-center"
              style={{ gridTemplateColumns: '22px 22px 1fr 46px 42px 1fr' }}
            >
              <span className="text-slate-600 text-xs font-mono">{rank}</span>
              <span className="text-slate-500 text-xs font-mono">{horse.postPosition}</span>
              <span className="text-slate-200 text-xs font-medium truncate">{horse.name}</span>
              <span className="text-sky-400 text-xs font-mono">
                {horse.primePower != null ? horse.primePower.toFixed(1) : '—'}
              </span>
              <span className="text-yellow-400 text-xs font-mono">{mlStr(horse.morningLine)}</span>
              <span className="text-slate-500 text-[10px] truncate">
                {[
                  horse.trainer ? `T: ${horse.trainer}` : null,
                  horse.jockey  ? `J: ${horse.jockey}`  : null,
                ].filter(Boolean).join(' / ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
