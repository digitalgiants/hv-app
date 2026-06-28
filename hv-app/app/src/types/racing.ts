export interface CareerStats {
  starts: number
  wins: number
  places: number
  shows: number
  earnings: number
}

export interface PersonStats {
  starts: number
  wins: number
  places: number
  shows: number
}

export interface Fraction {
  time1?: number  // seconds to first call (quarter-mile)
  time2?: number  // seconds to second call (half-mile)
  time3?: number  // seconds to third call (three-quarters)
  final?: number  // final time in seconds
}

export interface RunningPositions {
  start?: number
  first?: number
  second?: number
  stretch?: number
  finish?: number
}

export interface PastStart {
  date: string          // "05/30/14"
  track: string         // "AP"
  distance: number      // yards
  surface: string       // "D" | "T" | "AW"
  raceType: string      // "MdSpWt" | "Alw32000N2x" | "Clm10000" etc.
  purse?: number
  finish: number
  beatenLengths?: number | null
  speedFigure?: number | null
  speedPar?: number | null    // BRIS speed par for that race's class level
  earlyPaceFigure?: number | null
  middlePaceFigure?: number | null
  latePaceFigure?: number | null
  fractions: Fraction
  positions: RunningPositions
  jockey?: string
  weight?: number
  equipment?: string          // decoded: "Lasix" | "Blinkers" | "Lasix+Blinkers" | ""
  comment?: string
  firstPlace?: string
  secondPlace?: string
  thirdPlace?: string
  starters?: number
}

export interface Workout {
  date: string
  track: string
  distance: number  // yards
  time: string      // "49.4"
  mph?: number      // computed speed in miles per hour
  mark?: string     // "B" (bullet/best), "H" (handily), "g" (gate)
  rank?: string     // "1/6" (rank out of works at that distance/track)
}

export interface TrainerCatStat {
  starts: number
  wins: number
  places: number
  shows: number
  roi: number
}

export interface PPHorse {
  name: string
  programNumber: string
  postPosition: number
  sex: string       // "H" | "G" | "M" | "F" | "C" | "R"
  color: string
  age: number
  sire?: string
  dam?: string
  damSire?: string
  owner?: string
  trainer?: string
  jockey?: string
  weightLbs?: number
  morningLine?: number
  primePower?: number
  speedParForClass?: number
  daysSinceLastRace?: number
  bestSpeedFastTrack?: number
  bestSpeedOffTrack?: number
  bestSpeedTurf?: number
  bestSpeedDistance?: number
  trainerCatStats?: TrainerCatStat[]
  lifetime: CareerStats
  currentYear: CareerStats
  previousYear: CareerStats
  distStats?: CareerStats
  trackStats?: CareerStats
  turf?: CareerStats
  offTrack?: CareerStats
  trainerStats?: PersonStats
  jockeyStats?: PersonStats
  pastStarts: PastStart[]
  workouts?: Workout[]
}

export interface RaceInfo {
  track: string
  date: string        // "June 14, 2014"
  raceNumber: number
  distance: number    // yards
  surface: string
  raceType: string
  purse: number
  conditions: string
  horses: PPHorse[]
}
