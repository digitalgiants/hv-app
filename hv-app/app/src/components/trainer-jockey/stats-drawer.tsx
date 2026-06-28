'use client'

import { useState } from 'react'
import type { PersonStats, TrainerCatStat } from '@/types/racing'

interface Props {
  role: 'Trainer' | 'Jockey'
  name: string
  stats?: PersonStats
  catStats?: TrainerCatStat[]
}

function winPct(s: PersonStats): string {
  if (!s.starts) return '0%'
  return `${Math.round(s.wins / s.starts * 100)}%`
}

function itmPct(s: PersonStats): string {
  if (!s.starts) return '0%'
  return `${Math.round((s.wins + s.places + s.shows) / s.starts * 100)}%`
}

const CAT_LABELS = ['At Distance', 'At Track', 'Curr Yr (w/ROI)', 'Prev Yr (w/ROI)']

export function StatsDrawer({ role, name, stats, catStats }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-slate-300 hover:text-sky-300 transition-colors text-left"
      >
        {name}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-72 z-50 bg-slate-950 border-l border-slate-800 shadow-2xl
          transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-widest text-sky-400">{role}</p>
            <h2 className="text-white font-semibold text-sm mt-0.5">{name}</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-600 hover:text-slate-300 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {stats ? (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-600 mb-3">Season Stats</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Starts"  value={String(stats.starts)} />
                <StatCard label="Wins"    value={`${stats.wins} (${winPct(stats)})`} highlight />
                <StatCard label="Places"  value={String(stats.places)} />
                <StatCard label="Shows"   value={String(stats.shows)} />
                <StatCard label="ITM %"   value={itmPct(stats)} highlight />
                <StatCard label="W-P-S"   value={`${stats.wins}-${stats.places}-${stats.shows}`} />
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No season stats available.</p>
          )}

          {stats && stats.starts > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-600 mb-2">Visual</p>
              <WinBar stats={stats} />
            </div>
          )}

          {catStats && catStats.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-600 mb-3">Situational Stats</p>
              <div className="space-y-3">
                {catStats.map((cat, i) => {
                  const w = cat.starts ? Math.round(cat.wins / cat.starts * 100) : 0
                  const itm = cat.starts ? Math.round((cat.wins + cat.places + cat.shows) / cat.starts * 100) : 0
                  const roiColor = cat.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
                  return (
                    <div key={i} className="bg-slate-900 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                        {CAT_LABELS[i] ?? `Cat ${i + 1}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-slate-400">{cat.starts}sts</span>
                        <span className="text-sky-400">{w}%W</span>
                        <span className="text-slate-400">{itm}%ITM</span>
                        <span className={roiColor}>${(cat.roi + 2).toFixed(2)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-slate-900 rounded-lg px-3 py-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-sky-400' : 'text-slate-200'}`}>
        {value}
      </p>
    </div>
  )
}

function WinBar({ stats }: { stats: PersonStats }) {
  const winW  = stats.starts ? (stats.wins   / stats.starts * 100) : 0
  const plcW  = stats.starts ? (stats.places / stats.starts * 100) : 0
  const shwW  = stats.starts ? (stats.shows  / stats.starts * 100) : 0

  return (
    <div className="space-y-1.5">
      <Bar label="Win"   pct={winW}         color="bg-emerald-500" />
      <Bar label="Place" pct={winW + plcW}  color="bg-sky-600" />
      <Bar label="Show"  pct={winW + plcW + shwW} color="bg-slate-600" />
    </div>
  )
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-8">{label}</span>
      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 w-7 text-right">{Math.round(pct)}%</span>
    </div>
  )
}
