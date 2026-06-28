import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
import { entryToPPHorse } from '@/lib/entry-to-horse'
import { OddsTable } from '@/components/odds/odds-table'
import { BetSuggestions } from '@/components/odds/bet-suggestions'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default async function OddsPage({
  params,
}: {
  params: Promise<{ raceId: string }>
}) {
  const { raceId } = await params

  const race = await db.race.findUnique({
    where: { id: raceId },
    include: {
      track: true,
      entries: {
        include: { horse: true },
        orderBy: { postPosition: 'asc' },
      },
    },
  })

  if (!race) notFound()

  const horses = race.entries.map(entry =>
    entryToPPHorse({ ...entry, race: { raceDate: race.raceDate } })
  )

  const speedPar = horses[0]?.speedParForClass

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/races/${raceId}`}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                ← Race {race.raceNumber}
              </Link>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500">{race.track.code} · {formatDate(race.raceDate)}</span>
            </div>
            <h1 className="text-white font-bold text-lg">Odds Analysis</h1>
            <p className="text-slate-500 text-xs mt-0.5">{race.raceType}</p>
          </div>
          {speedPar != null && (
            <div className="text-right bg-slate-800/60 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Class Par</p>
              <p className="text-white font-bold text-lg font-mono">{speedPar}</p>
            </div>
          )}
        </div>
      </div>

      {/* Odds table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <OddsTable horses={horses} />
      </div>

      {/* Bet suggestions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Value Plays</h2>
        <BetSuggestions horses={horses} />
      </div>
    </div>
  )
}
