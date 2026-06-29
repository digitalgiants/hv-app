import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { entryToPPHorse } from '@/lib/entry-to-horse'
import { StripChart } from '@/components/maps/strip-chart'
import { FieldSummary } from '@/components/maps/field-summary'

export const dynamic = 'force-dynamic'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default async function MapsPage({
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

  // Sort ascending by primePower so rank 1 = lowest, rank N = highest (top of chart)
  const sorted = [...horses].sort((a, b) => (a.primePower ?? 0) - (b.primePower ?? 0))
  const rankedHorses = sorted.map((horse, i) => ({ horse, rank: i + 1 }))

  const speedPar = horses[0]?.speedParForClass ?? null

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
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
              <span className="text-xs text-slate-500">
                {race.track.code} · {formatDate(race.raceDate)}
              </span>
            </div>
            <h1 className="text-white font-bold text-lg">Figure Maps</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {race.raceType} · {horses.length} horses · Y-axis ranked by Prime Power
            </p>
          </div>
          {speedPar != null && (
            <div className="text-right bg-slate-800/60 rounded-lg px-3 py-2 flex-shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Class Par</p>
              <p className="text-white font-bold text-lg font-mono">{speedPar}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible field summary */}
      <FieldSummary horses={rankedHorses} />

      {/* Strip chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <StripChart rankedHorses={rankedHorses} speedPar={speedPar} />
      </div>
    </div>
  )
}
