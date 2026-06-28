import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
import { entryToPPHorse } from '@/lib/entry-to-horse'
import { RaceTabs } from '@/components/race-analysis/race-tabs'

function distanceLabel(yards: number) {
  const map: Record<number, string> = {
    660: '3 Furlongs', 880: '4 Furlongs', 1100: '5 Furlongs',
    1210: '5½ Furlongs', 1320: '6 Furlongs', 1430: '6½ Furlongs',
    1540: '7 Furlongs', 1760: '1 Mile', 1870: '1 1/16 Miles',
    1980: '1 1/8 Miles', 2200: '1 1/4 Miles', 2640: '1 1/2 Miles',
  }
  return map[yards] ?? `${(yards / 220).toFixed(1)} Furlongs`
}

function surfaceLabel(s: string) {
  if (s === 'T')  return 'Turf'
  if (s === 'AW') return 'All-Weather'
  return 'Dirt'
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export default async function RaceAnalysisPage({
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

  // Pull saved results for the Results tab
  const savedResults: Record<string, number> = {}
  for (const entry of race.entries) {
    if (entry.finishPosition != null) {
      savedResults[entry.programNumber] = entry.finishPosition
    }
  }
  const savedPayouts = (race.payouts as { win?: number; place?: number; show?: number } | null) ?? null

  const horses = race.entries.map(entry =>
    entryToPPHorse({ ...entry, race: { raceDate: race.raceDate } })
  )

  const speedPar = horses[0]?.speedParForClass

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Race header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">
                {race.track.code}
              </span>
              <span className="text-xs text-slate-500">{formatDate(race.raceDate)}</span>
              <span className="text-xs text-slate-500">Race {race.raceNumber}</span>
              {speedPar != null && (
                <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                  Class Par {speedPar}
                </span>
              )}
            </div>
            <h1 className="text-white font-bold text-xl">
              {distanceLabel(race.distance)} &middot; {surfaceLabel(race.surface)}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{race.raceType}</p>
          </div>
          <div className="flex items-start gap-2">
            {race.purse ? (
              <div className="text-right">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Purse</p>
                <p className="text-white font-semibold">${race.purse.toLocaleString()}</p>
              </div>
            ) : null}
            <Link
              href={`/races/${raceId}/odds`}
              className="px-3 py-1.5 rounded-lg bg-sky-900/50 border border-sky-700 text-sky-300 text-sm font-medium hover:bg-sky-800/60 transition-colors"
            >
              Odds
            </Link>
            <Link
              href={`/races/${raceId}/bets`}
              className="px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-300 text-sm font-medium hover:bg-emerald-800/60 transition-colors"
            >
              Bets
            </Link>
          </div>
        </div>
        {race.conditions && (
          <p className="text-slate-600 text-xs mt-3 leading-relaxed">{race.conditions}</p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 px-1">
        <span>Fig / EP / LP color scale:</span>
        <span className="text-emerald-400">90+ Elite</span>
        <span className="text-sky-400">80–89 Good</span>
        <span className="text-yellow-400">70–79 Avg</span>
        <span className="text-orange-400">60–69 Below</span>
        <span className="text-red-400">&lt;60 Poor</span>
        <span className="text-yellow-400 ml-2">• Bullet workout</span>
      </div>

      {/* Tabs */}
      <RaceTabs raceId={raceId} horses={horses} savedResults={savedResults} savedPayouts={savedPayouts} />
    </div>
  )
}
