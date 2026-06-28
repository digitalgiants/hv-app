import Link from 'next/link'
import { db } from '@/lib/db'

function surfaceLabel(s: string) {
  if (s === 'T')  return 'Turf'
  if (s === 'AW') return 'AW'
  return 'Dirt'
}

function surfaceBadge(s: string) {
  if (s === 'T')  return 'text-emerald-400 border-emerald-800 bg-emerald-950/40'
  if (s === 'AW') return 'text-purple-400 border-purple-800 bg-purple-950/40'
  return 'text-amber-400 border-amber-800 bg-amber-950/40'
}

function distanceLabel(yards: number) {
  const map: Record<number, string> = {
    660: '3f', 880: '4f', 1100: '5f', 1210: '5½f', 1320: '6f',
    1430: '6½f', 1540: '7f', 1760: '1m', 1870: '1 1/16m',
    1980: '1⅛m', 2200: '1¼m', 2640: '1½m',
  }
  return map[yards] ?? `${(yards / 220).toFixed(1)}f`
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export default async function RacesPage() {
  const races = await db.race.findMany({
    include: {
      track: true,
      _count: { select: { entries: true } },
    },
    orderBy: [{ raceDate: 'desc' }, { raceNumber: 'asc' }],
    take: 200,
  })

  // Group by date string
  const grouped = new Map<string, typeof races>()
  for (const race of races) {
    const key = race.raceDate.toISOString().slice(0, 10)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(race)
  }

  if (races.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">Race Cards</h1>
        <p className="text-slate-400 text-sm mb-6">
          No races imported yet. Upload a Brisnet CSV from the{' '}
          <Link href="/dashboard" className="text-sky-400 hover:underline">Dashboard</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Race Cards</h1>
          <p className="text-slate-400 text-sm mt-1">{races.length} races imported</p>
        </div>
        <Link
          href="/races/summary"
          className="px-3 py-1.5 rounded-lg bg-sky-900/50 border border-sky-700 text-sky-300 text-sm font-medium hover:bg-sky-800/60 transition-colors flex-shrink-0"
        >
          Card Summary
        </Link>
      </div>

      {Array.from(grouped.entries()).map(([dateKey, dayRaces]) => (
        <div key={dateKey}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-slate-300 font-semibold text-sm">
              {formatDate(new Date(dateKey + 'T00:00:00Z'))}
            </h2>
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-xs">{dayRaces[0]?.track.code}</span>
          </div>

          <div className="space-y-2">
            {dayRaces.map(race => (
              <Link
                key={race.id}
                href={`/races/${race.id}`}
                className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 hover:border-sky-700 transition-colors group"
              >
                {/* Race number */}
                <div className="w-8 h-8 rounded bg-slate-800 group-hover:bg-sky-900/50 flex items-center justify-center text-sm font-bold text-slate-400 group-hover:text-sky-400 flex-shrink-0 transition-colors">
                  {race.raceNumber}
                </div>

                {/* Race info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-white font-medium text-sm">{race.raceType}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${surfaceBadge(race.surface)}`}>
                      {surfaceLabel(race.surface)}
                    </span>
                    <span className="text-slate-400 text-sm">{distanceLabel(race.distance)}</span>
                    {race.purse ? (
                      <span className="text-slate-500 text-xs">${race.purse.toLocaleString()} purse</span>
                    ) : null}
                  </div>
                  {race.conditions && (
                    <p className="text-slate-600 text-xs mt-0.5 truncate">{race.conditions}</p>
                  )}
                </div>

                {/* Entry count */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">{race._count.entries} entries</p>
                </div>

                {/* Arrow */}
                <svg className="w-4 h-4 text-slate-700 group-hover:text-sky-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
