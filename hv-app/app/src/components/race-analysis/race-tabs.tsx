'use client'

import { useState } from 'react'
import type { PPHorse } from '@/types/racing'
import { PPCard } from '@/components/past-performance/pp-card'
import { PaceAnalysisTab } from '@/components/race-analysis/pace-analysis-tab'
import { ResultsTab } from '@/components/race-analysis/results-tab'

type Tab = 'pp' | 'pace' | 'results'

interface Props {
  raceId: string
  horses: PPHorse[]
  savedResults?: Record<string, number>
  savedPayouts?: { win?: number; place?: number; show?: number } | null
}

export function RaceTabs({ raceId, horses, savedResults, savedPayouts }: Props) {
  const [tab, setTab] = useState<Tab>('pp')

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-800 pb-0">
        {(['pp', 'pace', 'results'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2
              ${tab === t
                ? 'text-sky-400 border-sky-500 bg-slate-900/50'
                : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
          >
            {t === 'pp'      ? 'Past Performances' :
             t === 'pace'    ? 'Pace Analysis' :
             'Results'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'pp' && (
        <div className="space-y-4">
          {horses.map(horse => (
            <PPCard key={horse.programNumber} horse={horse} />
          ))}
        </div>
      )}

      {tab === 'pace' && (
        <PaceAnalysisTab horses={horses} />
      )}

      {tab === 'results' && (
        <ResultsTab raceId={raceId} horses={horses} savedResults={savedResults} savedPayouts={savedPayouts} />
      )}
    </div>
  )
}
