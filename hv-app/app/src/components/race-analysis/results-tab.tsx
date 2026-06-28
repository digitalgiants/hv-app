'use client'

import { useState } from 'react'
import type { PPHorse } from '@/types/racing'

interface Props {
  raceId: string
  horses: PPHorse[]
  savedResults?: Record<string, number>  // programNumber → finish position
  savedPayouts?: { win?: number; place?: number; show?: number } | null
}

export function ResultsTab({ raceId, horses, savedResults = {}, savedPayouts }: Props) {
  const [results,  setResults]  = useState<Record<string, number>>(savedResults)
  const [payouts,  setPayouts]  = useState({
    win:   savedPayouts?.win   ?? null as number | null,
    place: savedPayouts?.place ?? null as number | null,
    show:  savedPayouts?.show  ?? null as number | null,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function setFinish(programNumber: string, pos: number) {
    setResults(prev => ({ ...prev, [programNumber]: pos }))
    setSaved(false)
  }

  function setPayout(field: 'win' | 'place' | 'show', val: string) {
    const n = parseFloat(val)
    setPayouts(prev => ({ ...prev, [field]: isNaN(n) ? null : n }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/races/${raceId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          payouts: {
            win:   payouts.win,
            place: payouts.place,
            show:  payouts.show,
          },
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Save failed')
      } else {
        setSaved(true)
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const sorted = [...horses].sort((a, b) => a.postPosition - b.postPosition)
  const entered = Object.keys(results).filter(k => results[k] > 0)

  const finishOrder = [...sorted]
    .filter(h => results[h.programNumber] > 0)
    .sort((a, b) => (results[a.programNumber] ?? 99) - (results[b.programNumber] ?? 99))

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Entry grid */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Set Finish Positions</p>
          {sorted.map(horse => (
            <div key={horse.programNumber} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                {horse.postPosition}
              </span>
              <span className="text-slate-200 text-sm flex-1 truncate">{horse.name}</span>
              <select
                value={results[horse.programNumber] ?? ''}
                onChange={e => {
                  const v = parseInt(e.target.value)
                  if (!isNaN(v) && v > 0) setFinish(horse.programNumber, v)
                  else {
                    const next = { ...results }
                    delete next[horse.programNumber]
                    setResults(next)
                    setSaved(false)
                  }
                }}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-16"
              >
                <option value="">—</option>
                {Array.from({ length: horses.length }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          ))}

          {/* Payouts */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">$2 Payouts</p>
            <div className="grid grid-cols-3 gap-2">
              {(['win', 'place', 'show'] as const).map(field => (
                <div key={field}>
                  <label className="block text-[10px] text-slate-600 uppercase tracking-wide mb-1">{field}</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={payouts[field] ?? ''}
                      onChange={e => setPayout(field, e.target.value)}
                      placeholder="—"
                      className="w-full bg-slate-900 border border-slate-700 rounded pl-5 pr-2 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || entered.length === 0}
            className="mt-3 w-full py-2 rounded-lg bg-sky-700 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-medium transition-colors"
          >
            {saving ? 'Saving…' : 'Save Results'}
          </button>

          {saved && <p className="text-emerald-400 text-xs text-center">Results saved.</p>}
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>

        {/* Finish order preview */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Finish Order</p>
          {finishOrder.length === 0 ? (
            <p className="text-slate-600 text-sm">No results entered yet.</p>
          ) : (
            <div className="space-y-2">
              {finishOrder.map((horse, idx) => {
                const payLabel = idx === 0 ? 'Win' : idx === 1 ? 'Place' : idx === 2 ? 'Show' : null
                const payVal   = idx === 0 ? payouts.win : idx === 1 ? payouts.place : idx === 2 ? payouts.show : null
                return (
                  <div key={horse.programNumber} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 text-right ${
                      idx === 0 ? 'text-yellow-400' :
                      idx === 1 ? 'text-slate-300' :
                      idx === 2 ? 'text-amber-600' :
                      'text-slate-600'
                    }`}>
                      {results[horse.programNumber]}
                    </span>
                    <span className={`text-sm ${idx < 3 ? 'text-slate-200' : 'text-slate-500'}`}>
                      {horse.name}
                    </span>
                    {payLabel && payVal != null && (
                      <span className="ml-auto text-emerald-400 text-xs font-mono font-semibold">
                        {payLabel} ${payVal.toFixed(2)}
                      </span>
                    )}
                    {(!payLabel || payVal == null) && horse.morningLine != null && (
                      <span className="text-slate-600 text-xs ml-auto">{horse.morningLine}/1 ML</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Payout summary card */}
          {(payouts.win || payouts.place || payouts.show) && (
            <div className="mt-4 bg-slate-800/60 rounded-lg p-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">$2 Payouts</p>
              {payouts.win   != null && <div className="flex justify-between text-sm"><span className="text-yellow-400">Win</span><span className="font-mono text-emerald-400">${payouts.win.toFixed(2)}</span></div>}
              {payouts.place != null && <div className="flex justify-between text-sm"><span className="text-slate-300">Place</span><span className="font-mono text-emerald-400">${payouts.place.toFixed(2)}</span></div>}
              {payouts.show  != null && <div className="flex justify-between text-sm"><span className="text-amber-600">Show</span><span className="font-mono text-emerald-400">${payouts.show.toFixed(2)}</span></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
