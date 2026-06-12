import { PPCard } from "@/components/past-performance/pp-card"
import { sampleRace } from "@/lib/mock-data"

function formatDistance(yards: number): string {
  const map: Record<number, string> = {
    1760: "1 Mile", 1870: "1 1/16 Miles", 1980: "1 1/8 Miles", 2200: "1 1/4 Miles",
  }
  return map[yards] ?? `${(yards / 220).toFixed(1)} Furlongs`
}

export default function SampleRacePage() {
  const { track, date, raceNumber, distance, surface, raceType, purse, conditions, horses } =
    sampleRace

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Race header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">
                {track}
              </span>
              <span className="text-xs text-slate-500">{date}</span>
              <span className="text-xs text-slate-500">Race {raceNumber}</span>
            </div>
            <h1 className="text-white font-bold text-xl">
              {formatDistance(distance)} &middot; {surface === "AW" ? "All-Weather" : surface === "T" ? "Turf" : "Dirt"}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{raceType}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Purse</p>
            <p className="text-white font-semibold">${purse.toLocaleString()}</p>
          </div>
        </div>
        <p className="text-slate-600 text-xs mt-3 leading-relaxed">{conditions}</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 px-1">
        <span>Speed figures:</span>
        <span className="text-emerald-400">90+ Excellent</span>
        <span className="text-sky-400">80–89 Good</span>
        <span className="text-yellow-400">70–79 Average</span>
        <span className="text-orange-400">60–69 Below avg</span>
        <span className="text-red-400">&lt;60 Poor</span>
        <span className="text-yellow-400 ml-2">• Bullet workout</span>
      </div>

      {/* Horse cards */}
      <div className="space-y-4">
        {horses.map((horse) => (
          <PPCard key={horse.programNumber} horse={horse} />
        ))}
      </div>
    </div>
  )
}
