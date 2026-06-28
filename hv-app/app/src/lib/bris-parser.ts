// BRIS DRF past-performance CSV parser.
// Column positions are 1-indexed in comments; the c() helper converts to 0-indexed.
// Layout confirmed empirically from HOU02122021.csv + Visualizer named-range mapping.

export interface BrisParsedRow {
  // ── Race header ──────────────────────────────────────────────────────────────
  trackCode: string        // col 1
  raceDate: string         // col 2, YYYYMMDD
  raceNumber: number       // col 3
  postPosition: number     // col 4
  programNumber: string    // col 5 or 43
  distanceYards: number    // col 6
  surface: string          // col 7: D | T | A (we normalise A → AW)
  trackCondition: string   // col 8: ft / gd / my / sf / fm
  raceType: string         // col 9: A / C / M / S / N / R …
  breedType: string        // col 10: TB / AR / QH …
  raceNameShort: string    // col 11, e.g. "Alw 9600n2l"
  purse: number            // col 12
  claimingPrice: number    // col 13
  conditionsLong: string   // col 16
  numStarters: number      // col 24

  // ── People ───────────────────────────────────────────────────────────────────
  trainerName: string
  trainerStats: { starts: number; wins: number; places: number; shows: number }
  jockeyName: string
  jockeyStats: { starts: number; wins: number; places: number; shows: number }
  ownerName: string
  ownerColors: string

  // ── Horse ────────────────────────────────────────────────────────────────────
  horseName: string
  morningLine: number      // col 44
  horseAge: number         // col 47
  horseSex: string         // col 49: C / F / G / H / M / R
  horseColor: string       // col 50
  weightLbs: number        // col 51
  sire: string             // col 52
  sireSire: string         // col 53
  dam: string              // col 54
  damSire: string          // col 55
  breeder: string          // col 56
  stateFoaled: string      // col 57

  // ── Split stats (distance / current-track / turf / off-track) ────────────────
  distStats:  { starts: number; wins: number; places: number; shows: number; earnings: number }  // cols 65-69
  trackStats: { starts: number; wins: number; places: number; shows: number; earnings: number }  // cols 70-74
  turfStats:  { starts: number; wins: number; places: number; shows: number; earnings: number }  // cols 75-79
  wetStats:   { starts: number; wins: number; places: number; shows: number; earnings: number }  // cols 80-84

  // ── Career stats ─────────────────────────────────────────────────────────────
  lifetimeStarts: number; lifetimeWins: number; lifetimePlaces: number
  lifetimeShows: number;  lifetimeEarnings: number
  currentYear: number
  currStarts: number; currWins: number; currPlaces: number
  currShows: number;  currEarnings: number
  prevYear: number
  prevStarts: number; prevWins: number; prevPlaces: number
  prevShows: number;  prevEarnings: number

  // ── BRIS composite ratings ────────────────────────────────────────────────────
  primePower: number      // col 251 – BRIS Prime Power Rating
  speedParForClass: number // col 15  – BRIS speed par for today's race class

  // ── Best BRIS Speed summary (all-time per condition/situation) ────────────────
  bestSpeedFastTrack: number   // col 1178
  bestSpeedOffTrack: number    // col 1179
  bestSpeedTurf: number        // col 1180
  bestSpeedDistance: number    // col 1181

  // ── Trainer situational stat categories (4 groups: S/W/P/Sh/$2ROI each) ──────
  trainerCatStats: Array<{ starts: number; wins: number; places: number; shows: number; roi: number }>

  // ── Workouts (up to 12) ───────────────────────────────────────────────────────
  workouts: Array<{
    date: string       // YYYYMMDD
    timeSeconds: number
    track: string
    distanceYards: number
    condition: string
    code: string       // B (bullet) / H (handily) / g (gate)
    trackType: string  // MT (main track) / TT (training track)
    numWorks: number
    rank: number
  }>

  // ── Past races (up to 10, most recent first) ──────────────────────────────────
  pastRaces: Array<{
    date: string       // YYYYMMDD
    track: string
    condition: string
    distanceYards: number
    surface: string
    raceClass: string
    starters: number
    positions: {
      start: number; call1: number; call2: number
      stretch: number; finish: number
    }
    brisSpeed: number | null
    fractions: {
      quarter: number | null
      half: number | null
      threeQuarters: number | null
      final: number | null
    }
    comment: string
    firstPlace: string; secondPlace: string; thirdPlace: string
    weightLbs: number
    trainer: string
    jockey: string
    beatenLengths: number | null
    equipment: string       // 3-char code: char[0]=medication(B/F/G/C), char[1]=blinkers(U/O/N), char[2]=other(N/M/C)
    speedPar: number | null // BRIS speed par for that race's class level
  }>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function c(cols: string[], oneIdx: number): string {
  return (cols[oneIdx - 1] ?? '').trim()
}

function num(cols: string[], oneIdx: number): number {
  return parseFloat(c(cols, oneIdx)) || 0
}

function int(cols: string[], oneIdx: number): number {
  return parseInt(c(cols, oneIdx)) || 0
}

function normSurface(raw: string): string {
  const s = raw.trim().toUpperCase()
  if (s === 'A') return 'AW'
  return s || 'D'
}

// Build an array of N values from column `startOneIdx` to `startOneIdx + N - 1`
function span(cols: string[], startOneIdx: number, n: number): string[] {
  return Array.from({ length: n }, (_, i) => (cols[startOneIdx - 1 + i] ?? '').trim())
}

function spanNum(cols: string[], startOneIdx: number, n: number): number[] {
  return span(cols, startOneIdx, n).map(v => parseFloat(v) || 0)
}

function spanInt(cols: string[], startOneIdx: number, n: number): number[] {
  return span(cols, startOneIdx, n).map(v => parseInt(v) || 0)
}

function nullable(n: number): number | null {
  return n === 0 ? null : n
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseRow(cols: string[]): BrisParsedRow | null {
  if (cols.length < 100) return null

  const trackCode  = c(cols, 1)
  const raceDate   = c(cols, 2)
  const raceNumber = int(cols, 3)
  const postPos    = int(cols, 4)

  if (!trackCode || !raceDate || !raceNumber || !postPos) return null

  // ── Workouts (12 slots: cols 102–209) ────────────────────────────────────────
  const WORK_SLOTS = 12
  const workDates  = span(cols, 102, WORK_SLOTS)
  const workTimes  = spanNum(cols, 114, WORK_SLOTS)
  const workTracks = span(cols, 126, WORK_SLOTS)
  const workDists  = spanInt(cols, 138, WORK_SLOTS)
  const workConds  = span(cols, 150, WORK_SLOTS)
  const workCodes  = span(cols, 162, WORK_SLOTS)
  const workTypes  = span(cols, 174, WORK_SLOTS)
  const workNums   = spanInt(cols, 186, WORK_SLOTS)
  const workRanks  = spanInt(cols, 198, WORK_SLOTS)

  const workouts = workDates
    .map((date, i) => ({
      date,
      timeSeconds:  workTimes[i],
      track:        workTracks[i],
      distanceYards: workDists[i],
      condition:    workConds[i],
      code:         workCodes[i],
      trackType:    workTypes[i],
      numWorks:     workNums[i],
      rank:         workRanks[i],
    }))
    .filter(w => w.date && w.distanceYards > 0)

  // ── Standard past races (10 slots: cols 256–) ─────────────────────────────────
  const PP_SLOTS = 10
  const ppDates    = span(cols, 256, PP_SLOTS)
  const ppTracks   = span(cols, 276, PP_SLOTS)
  const ppConds    = span(cols, 306, PP_SLOTS)
  const ppDists    = spanInt(cols, 316, PP_SLOTS)
  const ppSurfs    = span(cols, 326, PP_SLOTS)
  const ppClasses  = span(cols, 536, PP_SLOTS)
  const ppStarters = spanInt(cols, 566, PP_SLOTS)
  const ppPosStart    = spanInt(cols, 576, PP_SLOTS)
  const ppPosCall1    = spanInt(cols, 586, PP_SLOTS)
  const ppPosCall2    = spanInt(cols, 596, PP_SLOTS)
  const ppPosStretch  = spanInt(cols, 606, PP_SLOTS)
  const ppPosFinish   = spanInt(cols, 616, PP_SLOTS)
  const ppBrisSpeed   = spanNum(cols, 856, PP_SLOTS)
  const ppFracQtr     = spanNum(cols, 876, PP_SLOTS)
  const ppFracHalf    = spanNum(cols, 888, PP_SLOTS)
  const ppFrac3Q      = spanNum(cols, 900, PP_SLOTS)
  const ppFracFinal   = spanNum(cols, 912, PP_SLOTS)
  const ppComments    = span(cols, 396, PP_SLOTS)
  const ppFirst       = span(cols, 406, PP_SLOTS)
  const ppSecond      = span(cols, 416, PP_SLOTS)
  const ppThird       = span(cols, 426, PP_SLOTS)
  const ppWeights     = spanInt(cols, 436, PP_SLOTS)
  const ppTrainers    = span(cols, 1056, PP_SLOTS)
  const ppJockeys     = span(cols, 1066, PP_SLOTS)
  // lengths behind at finish (col 736-745 appears to be cumulative beaten lengths)
  const ppBeaten      = spanNum(cols, 736, PP_SLOTS)
  const ppEquipment   = span(cols, 1096, PP_SLOTS)     // 3-char medication/equipment codes
  const ppSpeedPars   = spanNum(cols, 1167, PP_SLOTS)  // BRIS speed par for each past race class

  const pastRaces = ppDates
    .map((date, i) => ({
      date,
      track:         ppTracks[i],
      condition:     ppConds[i],
      distanceYards: ppDists[i],
      surface:       normSurface(ppSurfs[i]),
      raceClass:     ppClasses[i],
      starters:      ppStarters[i],
      positions: {
        start:   ppPosStart[i],
        call1:   ppPosCall1[i],
        call2:   ppPosCall2[i],
        stretch: ppPosStretch[i],
        finish:  ppPosFinish[i],
      },
      brisSpeed:    nullable(ppBrisSpeed[i]),
      fractions: {
        quarter:       nullable(ppFracQtr[i]),
        half:          nullable(ppFracHalf[i]),
        threeQuarters: nullable(ppFrac3Q[i]),
        final:         nullable(ppFracFinal[i]),
      },
      comment:     ppComments[i],
      firstPlace:  ppFirst[i],
      secondPlace: ppSecond[i],
      thirdPlace:  ppThird[i],
      weightLbs:   ppWeights[i],
      trainer:     ppTrainers[i],
      jockey:      ppJockeys[i],
      beatenLengths: nullable(ppBeaten[i]),
      equipment:   ppEquipment[i] || '',
      speedPar:    nullable(ppSpeedPars[i]),
    }))
    .filter(r => r.date && r.distanceYards > 0)

  return {
    trackCode,
    raceDate,
    raceNumber,
    postPosition: postPos,
    programNumber: c(cols, 5) || c(cols, 43),
    distanceYards: int(cols, 6),
    surface:       normSurface(c(cols, 7)),
    trackCondition: c(cols, 8),
    raceType:      c(cols, 9),
    breedType:     c(cols, 10),
    raceNameShort: c(cols, 11),
    purse:         int(cols, 12),
    claimingPrice: int(cols, 13),
    conditionsLong: c(cols, 16),
    numStarters:   int(cols, 24),

    trainerName: c(cols, 28),
    trainerStats: {
      starts: int(cols, 29), wins: int(cols, 30),
      places: int(cols, 31), shows: int(cols, 32),
    },
    jockeyName: c(cols, 33),
    jockeyStats: {
      starts: int(cols, 35), wins: int(cols, 36),
      places: int(cols, 37), shows: int(cols, 38),
    },
    ownerName:   c(cols, 39),
    ownerColors: c(cols, 40),

    horseName:   c(cols, 45),
    morningLine: num(cols, 44),
    horseAge:    int(cols, 47),
    horseSex:    c(cols, 49),
    horseColor:  c(cols, 50),
    weightLbs:   int(cols, 51),
    sire:        c(cols, 52),
    sireSire:    c(cols, 53),
    dam:         c(cols, 54),
    damSire:     c(cols, 55),
    breeder:     c(cols, 56),
    stateFoaled: c(cols, 57),

    distStats:  { starts: int(cols, 65), wins: int(cols, 66), places: int(cols, 67), shows: int(cols, 68), earnings: int(cols, 69) },
    trackStats: { starts: int(cols, 70), wins: int(cols, 71), places: int(cols, 72), shows: int(cols, 73), earnings: int(cols, 74) },
    turfStats:  { starts: int(cols, 75), wins: int(cols, 76), places: int(cols, 77), shows: int(cols, 78), earnings: int(cols, 79) },
    wetStats:   { starts: int(cols, 80), wins: int(cols, 81), places: int(cols, 82), shows: int(cols, 83), earnings: int(cols, 84) },

    primePower:       num(cols, 251),
    speedParForClass: num(cols, 15),

    bestSpeedFastTrack: int(cols, 1178),
    bestSpeedOffTrack:  int(cols, 1179),
    bestSpeedTurf:      int(cols, 1180),
    bestSpeedDistance:  int(cols, 1181),

    trainerCatStats: [
      { starts: int(cols, 1147), wins: int(cols, 1148), places: int(cols, 1149), shows: int(cols, 1150), roi: num(cols, 1151) },
      { starts: int(cols, 1152), wins: int(cols, 1153), places: int(cols, 1154), shows: int(cols, 1155), roi: num(cols, 1156) },
      { starts: int(cols, 1157), wins: int(cols, 1158), places: int(cols, 1159), shows: int(cols, 1160), roi: num(cols, 1161) },
      { starts: int(cols, 1162), wins: int(cols, 1163), places: int(cols, 1164), shows: int(cols, 1165), roi: num(cols, 1166) },
    ],

    lifetimeStarts:   int(cols, 97),
    lifetimeWins:     int(cols, 98),
    lifetimePlaces:   int(cols, 99),
    lifetimeShows:    int(cols, 100),
    lifetimeEarnings: int(cols, 101),
    currentYear:      int(cols, 85),
    currStarts:       int(cols, 86),
    currWins:         int(cols, 87),
    currPlaces:       int(cols, 88),
    currShows:        int(cols, 89),
    currEarnings:     int(cols, 90),
    prevYear:         int(cols, 91),
    prevStarts:       int(cols, 92),
    prevWins:         int(cols, 93),
    prevPlaces:       int(cols, 94),
    prevShows:        int(cols, 95),
    prevEarnings:     int(cols, 96),

    workouts,
    pastRaces,
  }
}

// Parse "YYYYMMDD" → JS Date object (UTC midnight)
export function brisDateToDate(yyyymmdd: string): Date | null {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null
  const y = yyyymmdd.slice(0, 4)
  const m = yyyymmdd.slice(4, 6)
  const d = yyyymmdd.slice(6, 8)
  const dt = new Date(`${y}-${m}-${d}T00:00:00Z`)
  return isNaN(dt.getTime()) ? null : dt
}
