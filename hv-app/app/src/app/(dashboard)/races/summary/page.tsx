import Link from 'next/link'
import { db } from '@/lib/db'
import { entryToPPHorse } from '@/lib/entry-to-horse'

function distLabel(yards: number) {
  const map: Record<number, string> = {
    660: '3f', 880: '4f', 1100: '5f', 1210: '5½f', 1320: '6f',
    1430: '6½f', 1540: '7f', 1760: '1m', 1870: '1 1/16m', 1980: '1⅛m',
    2200: '1¼m', 2640: '1½m',
  }
  return map[yards] ?? `${(yards / 220).toFixed(1)}f`
}

function surfBadge(s: string) {
  if (s === 'T')  return 'text-emerald-400'
  if (s === 'AW') return 'text-purple-400'
  return 'text-amber-400'
}

function mlStr(ml: number | undefined): string {
  if (!ml || ml <= 0) return '—'
  if (ml < 1) return `${Math.round(1 / ml)}/5`
  if (ml === 1) return '1/1'
  if (ml % 1 === 0.5) return `${Math.round(ml * 2)}/2`
  return `${Math.round(ml)}/1`
}

function ppColor(pp: number | undefined, ppSum: number): string {
  if (!pp || ppSum === 0) return 'text-slate-500'
  const prob = pp / ppSum
  if (prob >= 0.25) return 'text-emerald-400 font-bold'
  if (prob >= 0.15) return 'text-sky-400'
  if (prob >= 0.10) return 'text-yellow-400'
  return 'text-slate-400'
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const raw  = await searchParams
  const date = Array.isArray(raw.date) ? raw.date[0] : raw.date

  // All distinct race dates, descending
  const allDates = await db.race.findMany({
    select: { raceDate: true, track: { select: { code: true } } },
    distinct: ['raceDate'],
    orderBy: { raceDate: 'desc' },
    take: 30,
  })

  const latestDate = allDates[0]?.raceDate
  if (!latestDate) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-slate-500">No races imported yet.</p>
      </div>
    )
  }

  // Parse selected date or fall back to latest
  const targetDateStr = date ?? latestDate.toISOString().slice(0, 10)
  const targetDate = new Date(targetDateStr + 'T00:00:00Z')
  const nextDate   = new Date(targetDate.getTime() + 86400000)

  const races = await db.race.findMany({
    where: {
      raceDate: { gte: targetDate, lt: nextDate },
    },
    include: {
      track: true,
      entries: {
        include: { horse: true },
        orderBy: { postPosition: 'asc' },
      },
    },
    orderBy: { raceNumber: 'asc' },
  })

  const trackCode = races[0]?.track.code ?? ''

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      {/* Header + date picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">{trackCode} — Card Summary</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
            {' · '}{races.length} races
          </p>
        </div>

        {/* Date selector */}
        <div className="flex flex-wrap gap-1.5">
          {allDates.map(d => {
            const ds = d.raceDate.toISOString().slice(0, 10)
            const active = ds === targetDateStr
            return (
              <Link
                key={ds}
                href={`/races/summary?date=${ds}`}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors
                  ${active ? 'bg-sky-800 text-sky-200 border border-sky-600' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}
              >
                {ds}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Race cards grid */}
      <div className="space-y-3">
        {races.map(race => {
          const horses = race.entries.map(entry =>
            entryToPPHorse({ ...entry, race: { raceDate: race.raceDate } })
          )
          const ppSum = horses.reduce((s, h) => s + (h.primePower ?? 0), 0)
          // Sort by PP descending for display
          const sorted = [...horses].sort((a, b) => (b.primePower ?? 0) - (a.primePower ?? 0))
          const speedPar = horses[0]?.speedParForClass

          return (
            <div key={race.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Race header row */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                    {race.raceNumber}
                  </span>
                  <span className="text-sm font-medium text-slate-300">{race.raceType}</span>
                  <span className={`text-xs font-mono ${surfBadge(race.surface)}`}>
                    {distLabel(race.distance)} · {race.surface === 'D' ? 'Dirt' : race.surface === 'T' ? 'Turf' : 'AW'}
                  </span>
                  {speedPar != null && (
                    <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                      Par {speedPar}
                    </span>
                  )}
                  {race.purse ? (
                    <span className="text-[10px] text-slate-600">${race.purse.toLocaleString()}</span>
                  ) : null}
                </div>
                <Link
                  href={`/races/${race.id}`}
                  className="text-xs text-sky-500 hover:text-sky-300 transition-colors"
                >
                  Full PP →
                </Link>
              </div>

              {/* Horses compact grid */}
              <div className="px-4 py-2">
                <div
                  className="grid gap-x-4 text-[10px] uppercase tracking-widest text-slate-600 pb-1 border-b border-slate-800/60 mb-1"
                  style={{ gridTemplateColumns: '20px 20px 1fr 44px 56px 44px 44px 44px' }}
                >
                  <span>Pp</span><span>#</span><span>Horse</span>
                  <span>ML</span><span>PP Rtg</span>
                  <span>Spd</span><span>EP</span><span>LP</span>
                </div>
                {sorted.map(h => {
                  const pp = h.primePower
                  const bestSpd = h.pastStarts?.[0]?.speedFigure
                  const bestEP  = h.pastStarts?.[0]?.earlyPaceFigure
                  const bestLP  = h.pastStarts?.[0]?.latePaceFigure
                  return (
                    <div
                      key={h.programNumber}
                      className="grid gap-x-4 items-center py-1 border-b border-slate-800/30 last:border-0"
                      style={{ gridTemplateColumns: '20px 20px 1fr 44px 56px 44px 44px 44px' }}
                    >
                      <span className="text-slate-600 font-mono text-[11px]">{h.postPosition}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{h.programNumber}</span>
                      <span className="text-slate-200 text-xs font-medium truncate">{h.name}</span>
                      <span className="text-yellow-400 font-mono text-[11px]">{mlStr(h.morningLine)}</span>
                      <span className={`font-mono text-[11px] ${ppColor(pp, ppSum)}`}>
                        {pp ? pp.toFixed(1) : '—'}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{bestSpd ?? '—'}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{bestEP ?? '—'}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{bestLP ?? '—'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
