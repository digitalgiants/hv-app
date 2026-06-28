// Converts a Prisma Entry (with horse + rawData) into the PPHorse shape
// that all past-performance UI components consume.

import type { PPHorse, PastStart, Workout, CareerStats, PersonStats, TrainerCatStat } from '@/types/racing'

// ── rawData shape written by the import route ─────────────────────────────────
interface RawCareerBlock {
  starts: number; wins: number; places: number; shows: number; earnings: number
}
interface RawYearBlock extends RawCareerBlock { year: number }

interface EntryRawData {
  breedType: string
  ownerColors: string
  sireSire: string
  breeder: string
  stateFoaled: string
  primePower?: number | null
  speedParForClass?: number | null
  bestSpeedFastTrack?: number | null
  bestSpeedOffTrack?: number | null
  bestSpeedTurf?: number | null
  bestSpeedDistance?: number | null
  trainerCatStats?: Array<{ starts: number; wins: number; places: number; shows: number; roi: number }>
  trainerStats: { starts: number; wins: number; places: number; shows: number }
  jockeyStats:  { starts: number; wins: number; places: number; shows: number }
  careerStats: {
    lifetime:    RawCareerBlock
    currentYear: RawYearBlock
    prevYear:    RawYearBlock
  }
  distStats?:  RawCareerBlock
  trackStats?: RawCareerBlock
  turfStats?:  RawCareerBlock
  wetStats?:   RawCareerBlock
  workouts: Array<{
    date: string; timeSeconds: number; track: string; distanceYards: number
    condition: string; code: string; trackType: string; numWorks: number; rank: number
  }>
  pastRaces: Array<{
    date: string; track: string; condition: string; distanceYards: number; surface: string
    raceClass: string; starters: number
    positions: { start: number; call1: number; call2: number; stretch: number; finish: number }
    brisSpeed: number | null
    fractions: { quarter: number | null; half: number | null; threeQuarters: number | null; final: number | null }
    comment: string; firstPlace: string; secondPlace: string; thirdPlace: string
    weightLbs: number; trainer: string; jockey: string; beatenLengths: number | null
    equipment?: string
    speedPar?: number | null
  }>
}

// Decode 3-char BRIS equipment code → human-readable flag string
function decodeEquipment(code: string): string {
  if (!code || code.length < 2) return ''
  const parts: string[] = []
  // char[0] = medication: F=Furosemide(Lasix), B=Bute, G=Glycopyrrolate, C=Corticosteroid, A=Ace, N=None
  if (code[0] === 'F') parts.push('Lasix')
  // char[1] = blinkers: U=Using(on), O=Off(removed), N=None
  if (code[1] === 'U') parts.push('Blinkers')
  return parts.join('+')
}

// ── Pace-figure computation ───────────────────────────────────────────────────
// Normalized pace scores on a ~100-point scale. Par (100) = 18.33 yd/s = 440yd in 24s.

function computeEP(halfSec: number | null): number | null {
  if (!halfSec || halfSec <= 0) return null
  return Math.round(4650 / halfSec)
}

// MP: pace from quarter-call to half-call (440 yards)
function computeMP(quarterSec: number | null, halfSec: number | null): number | null {
  if (!quarterSec || !halfSec || halfSec <= quarterSec) return null
  const mpTime = halfSec - quarterSec
  if (mpTime <= 0) return null
  return Math.round((440 / mpTime) / 18.33 * 100)
}

function computeLP(halfSec: number | null, finalSec: number | null, distYards: number): number | null {
  if (!halfSec || !finalSec || halfSec <= 0 || finalSec <= halfSec) return null
  const lpTime  = finalSec - halfSec
  const lpYards = distYards - 880
  if (lpYards <= 0 || lpTime <= 0) return null
  return Math.round((lpYards / lpTime) / 18.33 * 100)
}

// ── Date formatters ───────────────────────────────────────────────────────────

function ymdToDisplay(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd
  return `${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(2, 4)}`
}

function formatWorkoutTime(seconds: number): string {
  if (!seconds) return ''
  if (seconds < 60) return seconds.toFixed(1)
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(1).padStart(4, '0')
  return `${m}:${s}`
}

// ── Prisma type (minimal) we expect ──────────────────────────────────────────
export interface DBEntryInput {
  postPosition: number
  programNumber: string
  jockey: string | null
  trainer: string | null
  owner: string | null
  weightLbs: number | null
  morningLine: number | null
  rawData: unknown
  horse: {
    name: string
    sire: string | null
    dam: string | null
    damSire: string | null
    color: string | null
    sex: string | null
    foalYear: number | null
  }
  race: {
    raceDate: Date
  }
}

// ── Main converter ────────────────────────────────────────────────────────────

export function entryToPPHorse(entry: DBEntryInput): PPHorse {
  const raw = entry.rawData as EntryRawData
  const cs  = raw?.careerStats

  const emptyStats: CareerStats = { starts: 0, wins: 0, places: 0, shows: 0, earnings: 0 }

  function toCareerStats(b: RawCareerBlock | undefined): CareerStats {
    if (!b) return emptyStats
    return { starts: b.starts, wins: b.wins, places: b.places, shows: b.shows, earnings: b.earnings }
  }

  function toPersonStats(b: { starts: number; wins: number; places: number; shows: number } | undefined): PersonStats | undefined {
    if (!b) return undefined
    return { starts: b.starts, wins: b.wins, places: b.places, shows: b.shows }
  }

  const raceYear = entry.race.raceDate.getUTCFullYear()
  const foalYear = entry.horse.foalYear && entry.horse.foalYear > 0 ? entry.horse.foalYear : null
  const age = foalYear ? raceYear - foalYear : 0

  // ── Days since last race ────────────────────────────────────────────────────
  const firstPastDate = raw?.pastRaces?.[0]?.date
  let daysSinceLastRace: number | undefined
  if (firstPastDate && firstPastDate.length === 8) {
    const lastRaceMs = Date.UTC(
      parseInt(firstPastDate.slice(0, 4)),
      parseInt(firstPastDate.slice(4, 6)) - 1,
      parseInt(firstPastDate.slice(6, 8)),
    )
    const raceDateMs = entry.race.raceDate.getTime()
    const diff = Math.floor((raceDateMs - lastRaceMs) / 86400000)
    if (diff >= 0 && diff < 3650) daysSinceLastRace = diff
  }

  // ── Past starts ─────────────────────────────────────────────────────────────
  const pastStarts: PastStart[] = (raw?.pastRaces ?? []).map(pr => {
    const ep = computeEP(pr.fractions.half)
    const mp = computeMP(pr.fractions.quarter, pr.fractions.half)
    const lp = computeLP(pr.fractions.half, pr.fractions.final, pr.distanceYards)

    return {
      date:         ymdToDisplay(pr.date),
      track:        pr.track,
      distance:     pr.distanceYards,
      surface:      pr.surface,
      raceType:     pr.raceClass,
      finish:       pr.positions.finish,
      beatenLengths: pr.beatenLengths,
      speedFigure:  pr.brisSpeed,
      earlyPaceFigure:   ep,
      middlePaceFigure:  mp,
      latePaceFigure:    lp,
      fractions: {
        time1: pr.fractions.quarter  ?? undefined,
        time2: pr.fractions.half     ?? undefined,
        time3: pr.fractions.threeQuarters ?? undefined,
        final: pr.fractions.final    ?? undefined,
      },
      positions: {
        start:   pr.positions.start   || undefined,
        first:   pr.positions.call1   || undefined,
        second:  pr.positions.call2   || undefined,
        stretch: pr.positions.stretch || undefined,
        finish:  pr.positions.finish  || undefined,
      },
      starters:    pr.starters || undefined,
      comment:     pr.comment  || undefined,
      jockey:      pr.jockey   || undefined,
      weight:      pr.weightLbs || undefined,
      equipment:   pr.equipment ? decodeEquipment(pr.equipment) || undefined : undefined,
      speedPar:    pr.speedPar ?? undefined,
      firstPlace:  pr.firstPlace  || undefined,
      secondPlace: pr.secondPlace || undefined,
      thirdPlace:  pr.thirdPlace  || undefined,
    }
  })

  // ── Workouts ─────────────────────────────────────────────────────────────────
  const workouts: Workout[] = (raw?.workouts ?? []).map(w => {
    const mph = w.timeSeconds > 0
      ? Math.round((w.distanceYards / 1760) / (w.timeSeconds / 3600) * 10) / 10
      : undefined
    return {
      date:     ymdToDisplay(w.date),
      track:    w.track,
      distance: w.distanceYards,
      time:     formatWorkoutTime(w.timeSeconds),
      mph,
      mark:     w.code || undefined,
      rank:     w.numWorks && w.rank ? `${w.rank}/${w.numWorks}` : undefined,
    }
  })

  function toSplitStats(b: RawCareerBlock | undefined): CareerStats | undefined {
    if (!b || b.starts === 0) return undefined
    return { starts: b.starts, wins: b.wins, places: b.places, shows: b.shows, earnings: b.earnings }
  }

  const trainerCatStats: TrainerCatStat[] | undefined = raw?.trainerCatStats?.length
    ? raw.trainerCatStats.map(s => ({ starts: s.starts, wins: s.wins, places: s.places, shows: s.shows, roi: s.roi }))
    : undefined

  return {
    name:         entry.horse.name,
    programNumber: entry.programNumber,
    postPosition: entry.postPosition,
    sex:          entry.horse.sex   ?? 'G',
    color:        entry.horse.color ?? 'B',
    age,
    sire:         entry.horse.sire    ?? undefined,
    dam:          entry.horse.dam     ?? undefined,
    damSire:      entry.horse.damSire ?? undefined,
    owner:        entry.owner    ?? undefined,
    trainer:      entry.trainer  ?? undefined,
    jockey:       entry.jockey   ?? undefined,
    weightLbs:    entry.weightLbs   ?? undefined,
    morningLine:  entry.morningLine ?? undefined,
    primePower:        raw?.primePower        ?? undefined,
    speedParForClass:  raw?.speedParForClass  ?? undefined,
    daysSinceLastRace,
    bestSpeedFastTrack: raw?.bestSpeedFastTrack || undefined,
    bestSpeedOffTrack:  raw?.bestSpeedOffTrack  || undefined,
    bestSpeedTurf:      raw?.bestSpeedTurf      || undefined,
    bestSpeedDistance:  raw?.bestSpeedDistance  || undefined,
    trainerCatStats,
    lifetime:     toCareerStats(cs?.lifetime),
    currentYear:  toCareerStats(cs?.currentYear),
    previousYear: toCareerStats(cs?.prevYear),
    distStats:    toSplitStats(raw?.distStats),
    trackStats:   toSplitStats(raw?.trackStats),
    turf:         toSplitStats(raw?.turfStats),
    offTrack:     toSplitStats(raw?.wetStats),
    trainerStats: toPersonStats(raw?.trainerStats),
    jockeyStats:  toPersonStats(raw?.jockeyStats),
    pastStarts,
    workouts: workouts.length > 0 ? workouts : undefined,
  }
}
