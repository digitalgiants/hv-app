'use client'

import { useState } from 'react'
import type { PPHorse } from '@/types/racing'

interface Props {
  horses: PPHorse[]
}

type BetType = 'win' | 'place' | 'show'

interface Selection {
  win: boolean
  place: boolean
  show: boolean
  amount: string   // dollar string, e.g. "2"
}

// Exotic legs
interface ExoticBet {
  type: 'exacta' | 'trifecta' | 'superfecta' | 'double'
  legs: string[][]  // outer = each leg, inner = selected program numbers
  amount: string
  boxed: boolean
}

function factorial(n: number): number {
  if (n <= 1) return 1
  return n * factorial(n - 1)
}

function permutations(n: number, r: number): number {
  if (r > n) return 0
  return factorial(n) / factorial(n - r)
}

function combos(legs: string[][], boxed: boolean, r: number): number {
  if (boxed) {
    // Each leg merged, count unique horses × P(n,r)
    const allHorses = new Set(legs.flat())
    const n = allHorses.size
    return permutations(n, r)
  }
  return legs.reduce((acc, leg) => acc * leg.length, 1)
}

const EXOTIC_INFO: Record<ExoticBet['type'], { label: string; legs: number; r: number }> = {
  exacta:     { label: 'Exacta',     legs: 2, r: 2 },
  trifecta:   { label: 'Trifecta',   legs: 3, r: 3 },
  superfecta: { label: 'Superfecta', legs: 4, r: 4 },
  double:     { label: 'Daily Double', legs: 2, r: 2 },
}

export function BettingWorkspace({ horses }: Props) {
  const sorted = [...horses].sort((a, b) => a.postPosition - b.postPosition)

  const defaultSel = (): Selection => ({ win: false, place: false, show: false, amount: '2' })
  const [selections, setSelections] = useState<Record<string, Selection>>(
    Object.fromEntries(sorted.map(h => [h.programNumber, defaultSel()]))
  )

  const [exotics, setExotics] = useState<ExoticBet[]>([
    { type: 'exacta', legs: [[], []], amount: '2', boxed: false },
  ])

  function toggleBet(prog: string, type: BetType) {
    setSelections(prev => ({
      ...prev,
      [prog]: { ...prev[prog], [type]: !prev[prog][type] },
    }))
  }

  function setAmount(prog: string, val: string) {
    setSelections(prev => ({ ...prev, [prog]: { ...prev[prog], amount: val } }))
  }

  function addExotic(type: ExoticBet['type']) {
    const info = EXOTIC_INFO[type]
    setExotics(prev => [
      ...prev,
      { type, legs: Array.from({ length: info.legs }, () => []), amount: '2', boxed: false },
    ])
  }

  function removeExotic(idx: number) {
    setExotics(prev => prev.filter((_, i) => i !== idx))
  }

  function toggleExoticLeg(exoticIdx: number, legIdx: number, prog: string) {
    setExotics(prev => prev.map((ex, i) => {
      if (i !== exoticIdx) return ex
      const leg = ex.legs[legIdx]
      const next = leg.includes(prog) ? leg.filter(p => p !== prog) : [...leg, prog]
      const legs = ex.legs.map((l, li) => li === legIdx ? next : l)
      return { ...ex, legs }
    }))
  }

  // ── Cost computations ──────────────────────────────────────────────────────
  let straightTotal = 0
  const straightLines: string[] = []

  for (const horse of sorted) {
    const sel = selections[horse.programNumber]
    if (!sel) continue
    const amt = parseFloat(sel.amount) || 2
    if (sel.win)   { straightTotal += amt; straightLines.push(`#${horse.postPosition} Win $${amt}`) }
    if (sel.place) { straightTotal += amt; straightLines.push(`#${horse.postPosition} Place $${amt}`) }
    if (sel.show)  { straightTotal += amt; straightLines.push(`#${horse.postPosition} Show $${amt}`) }
  }

  const exoticCosts = exotics.map(ex => {
    const info = EXOTIC_INFO[ex.type]
    const c    = combos(ex.legs, ex.boxed, info.r)
    const amt  = parseFloat(ex.amount) || 2
    return c * amt
  })
  const exoticTotal = exoticCosts.reduce((a, b) => a + b, 0)
  const grandTotal  = straightTotal + exoticTotal

  const hasStraight = straightTotal > 0
  const hasExotic   = exotics.some(ex => ex.legs.some(l => l.length > 0))

  return (
    <div className="space-y-6">
      {/* Straight wagers */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Straight Wagers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-600 border-b border-slate-800">
                <th className="text-left pb-2 pr-3 font-normal w-8">#</th>
                <th className="text-left pb-2 pr-3 font-normal">Horse</th>
                <th className="text-center pb-2 px-2 font-normal">ML</th>
                <th className="text-center pb-2 px-2 font-normal">Win</th>
                <th className="text-center pb-2 px-2 font-normal">Place</th>
                <th className="text-center pb-2 px-2 font-normal">Show</th>
                <th className="text-right pb-2 font-normal">Amt</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(horse => {
                const sel = selections[horse.programNumber] ?? defaultSel()
                return (
                  <tr key={horse.programNumber} className="border-b border-slate-800/50">
                    <td className="py-2 pr-3 text-slate-500 font-mono">{horse.postPosition}</td>
                    <td className="py-2 pr-3 text-slate-200 font-medium">{horse.name}</td>
                    <td className="py-2 px-2 text-center text-slate-500">
                      {horse.morningLine ? `${horse.morningLine}/1` : '—'}
                    </td>
                    {(['win', 'place', 'show'] as BetType[]).map(type => (
                      <td key={type} className="py-2 px-2 text-center">
                        <button
                          onClick={() => toggleBet(horse.programNumber, type)}
                          className={`w-7 h-7 rounded font-medium text-xs transition-colors ${
                            sel[type]
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          {type === 'win' ? 'W' : type === 'place' ? 'P' : 'S'}
                        </button>
                      </td>
                    ))}
                    <td className="py-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={sel.amount}
                        onChange={e => setAmount(horse.programNumber, e.target.value)}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 text-right"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {hasStraight && (
          <div className="mt-3 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-xs space-y-1">
            {straightLines.map((line, i) => (
              <p key={i} className="text-slate-400">{line}</p>
            ))}
            <p className="text-slate-200 font-semibold pt-1 border-t border-slate-800">
              Straight total: ${straightTotal.toFixed(2)}
            </p>
          </div>
        )}
      </section>

      {/* Exotic wagers */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">Exotic Wagers</h2>
          <div className="flex gap-2">
            {(Object.keys(EXOTIC_INFO) as ExoticBet['type'][]).map(type => (
              <button
                key={type}
                onClick={() => addExotic(type)}
                className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
              >
                + {EXOTIC_INFO[type].label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {exotics.map((ex, exIdx) => {
            const info = EXOTIC_INFO[ex.type]
            const cost = exoticCosts[exIdx]

            return (
              <div key={exIdx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-200 font-medium text-sm">{info.label}</span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ex.boxed}
                        onChange={e => setExotics(prev => prev.map((x, i) => i === exIdx ? { ...x, boxed: e.target.checked } : x))}
                        className="rounded"
                      />
                      Box
                    </label>
                    <span className="text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={ex.amount}
                      onChange={e => setExotics(prev => prev.map((x, i) => i === exIdx ? { ...x, amount: e.target.value } : x))}
                      className="w-12 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 text-right"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">Cost: <span className="text-sky-400 font-mono">${cost.toFixed(2)}</span></span>
                    <button onClick={() => removeExotic(exIdx)} className="text-slate-700 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${info.legs}, 1fr)` }}>
                  {Array.from({ length: info.legs }, (_, legIdx) => (
                    <div key={legIdx}>
                      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">
                        {legIdx === 0 ? '1st' : legIdx === 1 ? '2nd' : legIdx === 2 ? '3rd' : '4th'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {sorted.map(horse => {
                          const selected = ex.legs[legIdx]?.includes(horse.programNumber)
                          return (
                            <button
                              key={horse.programNumber}
                              onClick={() => toggleExoticLeg(exIdx, legIdx, horse.programNumber)}
                              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                                selected
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              {horse.postPosition}
                            </button>
                          )
                        })}
                      </div>
                      {ex.legs[legIdx]?.length > 0 && (
                        <p className="text-[10px] text-slate-600 mt-1">
                          {ex.legs[legIdx].map(p => {
                            const h = sorted.find(s => s.programNumber === p)
                            return h?.name
                          }).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Grand total */}
      {(hasStraight || hasExotic) && (
        <div className="bg-slate-900 border border-emerald-800/50 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Outlay</p>
            <p className="text-2xl font-bold text-emerald-400">${grandTotal.toFixed(2)}</p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-0.5">
            {hasStraight && <p>Straight: ${straightTotal.toFixed(2)}</p>}
            {hasExotic   && <p>Exotics:  ${exoticTotal.toFixed(2)}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
