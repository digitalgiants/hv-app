import type { PPHorse } from "@/types/racing"

interface Props {
  horse: PPHorse
}

function statBlock(label: string, stats: { starts: number; wins: number; places: number; shows: number; earnings: number }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs text-slate-300 font-mono">
        {stats.starts}-{stats.wins}-{stats.places}-{stats.shows}
      </div>
      <div className="text-[10px] text-slate-500">
        ${stats.earnings.toLocaleString()}
      </div>
    </div>
  )
}

function sexLabel(sex: string): string {
  const map: Record<string, string> = {
    H: "Horse", G: "Gelding", M: "Mare", F: "Filly", C: "Colt", R: "Ridgling",
  }
  return map[sex] ?? sex
}

function colorLabel(color: string): string {
  const map: Record<string, string> = {
    B: "Bay", CH: "Chestnut", GR: "Gray", "GR/RO": "Gray/Roan",
    "DK B/BR": "Dk Bay/Br", RO: "Roan", WH: "White",
  }
  return map[color] ?? color
}

export function HorseHeader({ horse }: Props) {
  const mlDisplay = horse.morningLine
    ? horse.morningLine < 1
      ? `${Math.round(1 / horse.morningLine)}/1`
      : horse.morningLine === 1
        ? "1/1"
        : `${horse.morningLine}/1`
    : "—"

  return (
    <div className="space-y-2">
      {/* Top row: post, name, weight, ML */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
          {horse.postPosition}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="text-lg font-bold text-white tracking-wide">{horse.name}</h2>
            <span className="text-slate-400 text-sm">{horse.weightLbs} lbs</span>
            <span className="text-yellow-400 text-sm font-semibold">{mlDisplay} ML</span>
          </div>
          {/* Breeding line */}
          <p className="text-xs text-slate-500 mt-0.5">
            {colorLabel(horse.color)} {sexLabel(horse.sex)}, {horse.age}yo &mdash;{" "}
            {horse.sire ?? "—"} – {horse.dam ?? "—"} ({horse.damSire ?? "—"})
          </p>
        </div>
      </div>

      {/* Trainer / Jockey / Owner */}
      <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs pl-10">
        <span>
          <span className="text-slate-500">Trainer: </span>
          <span className="text-slate-300">{horse.trainer ?? "—"}</span>
        </span>
        <span>
          <span className="text-slate-500">Jockey: </span>
          <span className="text-slate-300">{horse.jockey ?? "—"}</span>
        </span>
        <span>
          <span className="text-slate-500">Owner: </span>
          <span className="text-slate-400">{horse.owner ?? "—"}</span>
        </span>
      </div>

      {/* Career stats */}
      <div className="pl-10 flex gap-6">
        {statBlock("Lifetime", horse.lifetime)}
        {statBlock(new Date().getFullYear().toString(), horse.currentYear)}
        {statBlock((new Date().getFullYear() - 1).toString(), horse.previousYear)}
        {horse.turf && statBlock("Turf", horse.turf)}
        {horse.offTrack && statBlock("Off Track", horse.offTrack)}
      </div>
    </div>
  )
}
