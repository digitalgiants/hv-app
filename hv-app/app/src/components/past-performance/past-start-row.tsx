import type { PastStart } from '@/types/racing'

interface Props {
  start: PastStart
  index: number
}

const COLS = '52px 40px 68px 76px 52px 20px 78px 36px 36px 36px 36px 1fr'

function formatDistance(yards: number): string {
  const map: Record<number, string> = {
    660: '3f', 770: '3½f', 880: '4f', 990: '4½f',
    1100: '5f', 1210: '5½f', 1320: '6f', 1430: '6½f',
    1540: '7f', 1650: '7½f', 1760: '1m', 1870: '1 1/16m',
    1980: '1⅛m', 2090: '1 3/16m', 2200: '1¼m', 2420: '1⅜m', 2640: '1½m',
  }
  return map[yards] ?? `${(yards / 220).toFixed(1)}f`
}

function formatTime(secs: number | undefined): string {
  if (!secs) return '—'
  if (secs < 60) return secs.toFixed(2)
  const mins = Math.floor(secs / 60)
  const rem = (secs % 60).toFixed(2).padStart(5, '0')
  return `${mins}:${rem}`
}

function figureClass(val: number | null | undefined): string {
  if (!val) return 'text-slate-600'
  if (val >= 90) return 'text-emerald-400 font-bold'
  if (val >= 80) return 'text-sky-400 font-semibold'
  if (val >= 70) return 'text-yellow-400'
  if (val >= 60) return 'text-orange-400'
  return 'text-red-400'
}

function paceClass(val: number | null | undefined): string {
  if (!val) return 'text-slate-600'
  if (val >= 105) return 'text-emerald-400 font-bold'
  if (val >= 100) return 'text-sky-400'
  if (val >= 95)  return 'text-yellow-400'
  if (val >= 88)  return 'text-orange-400'
  return 'text-red-400'
}

function surfaceBadge(surface: string): string {
  if (surface === 'T')  return 'bg-emerald-900/50 text-emerald-400 border-emerald-800'
  if (surface === 'AW') return 'bg-purple-900/50 text-purple-400 border-purple-800'
  return 'bg-amber-900/50 text-amber-400 border-amber-800'
}

export function PastStartRow({ start, index }: Props) {
  const pos = start.positions
  const runningLine = [pos.start, pos.first, pos.second, pos.stretch, pos.finish]
    .map(p => (p != null ? String(p) : '—'))
    .join('-')

  return (
    <div
      className={`grid gap-x-2 text-xs py-1.5 border-b border-slate-800/60 items-start
        ${index % 2 === 0 ? 'bg-slate-900/30' : ''}`}
      style={{ gridTemplateColumns: COLS }}
    >
      {/* Date */}
      <span className="text-slate-400 font-mono tabular-nums">{start.date}</span>

      {/* Track */}
      <span className="text-slate-300 font-medium">{start.track}</span>

      {/* Distance + Surface */}
      <span className="flex items-center gap-1">
        <span className="text-slate-300">{formatDistance(start.distance)}</span>
        <span className={`text-[10px] px-1 rounded border ${surfaceBadge(start.surface)}`}>
          {start.surface}
        </span>
      </span>

      {/* Race class */}
      <span className="text-slate-500 truncate">{start.raceType}</span>

      {/* Fractions: half / final stacked */}
      <span className="text-slate-500 font-mono tabular-nums text-[10px] leading-4">
        {formatTime(start.fractions.time2)}<br />
        {formatTime(start.fractions.final)}
      </span>

      {/* Finish */}
      <span className={`font-bold ${
        start.finish === 1 ? 'text-emerald-400' :
        start.finish <= 3 ? 'text-sky-400' :
        'text-slate-400'
      }`}>
        {start.finish}
      </span>

      {/* Running line */}
      <span className="text-slate-500 font-mono tabular-nums">{runningLine}</span>

      {/* Speed figure (with par indicator) */}
      <span className={`font-mono tabular-nums ${figureClass(start.speedFigure)}`}>
        {start.speedFigure ?? '—'}
        {start.speedFigure != null && start.speedPar != null && (
          <span className={`ml-0.5 text-[9px] ${start.speedFigure >= start.speedPar ? 'text-emerald-600' : 'text-red-700'}`}>
            {start.speedFigure >= start.speedPar ? '▲' : '▼'}
          </span>
        )}
      </span>

      {/* Early Pace */}
      <span className={`font-mono tabular-nums ${paceClass(start.earlyPaceFigure)}`}>
        {start.earlyPaceFigure ?? '—'}
      </span>

      {/* Middle Pace */}
      <span className={`font-mono tabular-nums ${paceClass(start.middlePaceFigure)}`}>
        {start.middlePaceFigure ?? '—'}
      </span>

      {/* Late Pace */}
      <span className={`font-mono tabular-nums ${paceClass(start.latePaceFigure)}`}>
        {start.latePaceFigure ?? '—'}
      </span>

      {/* Comment + equipment flags */}
      <span className="text-slate-500 truncate col-span-1 leading-tight">
        {start.equipment && (
          <span className="text-amber-400 text-[9px] font-semibold mr-1">[{start.equipment}]</span>
        )}
        {start.comment}
      </span>
    </div>
  )
}

export function PastStartHeader() {
  return (
    <div
      className="grid gap-x-2 text-[10px] uppercase tracking-wider text-slate-600 pb-1 border-b border-slate-700"
      style={{ gridTemplateColumns: COLS }}
    >
      <span>Date</span>
      <span>Trk</span>
      <span>Dist/Srf</span>
      <span>Class</span>
      <span>Fracs</span>
      <span>Fin</span>
      <span>S-1-2-S-F</span>
      <span>Fig</span>
      <span>EP</span>
      <span>MP</span>
      <span>LP</span>
      <span>Comment</span>
    </div>
  )
}
