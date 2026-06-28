import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
import { entryToPPHorse } from '@/lib/entry-to-horse'
import { BettingWorkspace } from '@/components/betting/workspace'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default async function BetsPage({
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/races/${raceId}`}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">
              {race.track.code}
            </span>
            <span className="text-xs text-slate-500">{formatDate(race.raceDate)}</span>
            <span className="text-xs text-slate-500">Race {race.raceNumber}</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-0.5">Betting Workspace</h1>
        </div>
      </div>

      <BettingWorkspace horses={horses} />
    </div>
  )
}
