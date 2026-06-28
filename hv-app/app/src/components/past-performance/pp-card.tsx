import type { PPHorse } from "@/types/racing"
import { HorseHeader } from "./horse-header"
import { SpeedFigureChart } from "./speed-figure-chart"
import { PastStartRow, PastStartHeader } from "./past-start-row"

interface Props {
  horse: PPHorse
}

function WorkoutLine({ date, track, distance, time, mph, mark, rank }: {
  date: string; track: string; distance: number; time: string; mph?: number; mark?: string; rank?: string
}) {
  const distMap: Record<number, string> = {
    330: "3f", 440: "2f", 660: "3f", 880: "4f", 1100: "5f", 1320: "6f"
  }
  const distLabel = distMap[distance] ?? `${(distance / 220).toFixed(0)}f`
  return (
    <span className="text-[10px] text-slate-500 whitespace-nowrap">
      {date} {track} {distLabel} {time}
      {mph != null && <span className="text-slate-600 ml-1">{mph}mph</span>}
      {mark === "B" && <span className="text-yellow-400 ml-0.5">•</span>}
      {rank && <span className="text-slate-600 ml-0.5">({rank})</span>}
    </span>
  )
}

export function PPCard({ horse }: Props) {
  const figuredStarts = horse.pastStarts.filter((s) => s.speedFigure != null)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header section */}
      <div className="p-4 border-b border-slate-800">
        <HorseHeader horse={horse} />
      </div>

      {/* Speed figure chart */}
      {figuredStarts.length > 1 && (
        <div className="px-4 pt-3 pb-1 border-b border-slate-800">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">
            Speed Figure Trend (oldest → most recent)
          </p>
          <SpeedFigureChart pastStarts={horse.pastStarts} />
        </div>
      )}

      {/* Past performances */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">
          Past Performances
        </p>
        <div className="overflow-x-auto">
          <div className="min-w-[820px]">
            <PastStartHeader />
            {horse.pastStarts.map((start, i) => (
              <PastStartRow key={`${start.date}-${start.track}`} start={start} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Workouts */}
      {horse.workouts && horse.workouts.length > 0 && (
        <div className="px-4 pb-3 border-t border-slate-800 pt-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">
            Workouts
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {horse.workouts.map((w) => (
              <WorkoutLine key={`${w.date}-${w.track}`} {...w} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
