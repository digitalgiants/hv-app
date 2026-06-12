export interface CareerStats {
  starts: number
  wins: number
  places: number
  shows: number
  earnings: number
}

export interface Fraction {
  time1?: number  // seconds to first call
  time2?: number  // seconds to second call
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
  beatenLengths?: number
  speedFigure?: number | null
  earlyPaceFigure?: number
  latePaceFigure?: number
  fractions: Fraction
  positions: RunningPositions
  jockey?: string
  weight?: number
  comment?: string
}

export interface Workout {
  date: string
  track: string
  distance: number  // yards
  time: string      // "49.4B"
  mark?: string     // "B" (bullet/best), "H" (handily), "g" (gate)
  rank?: string     // "1/6" (rank out of works at that distance/track)
}

export interface PPHorse {
  name: string
  programNumber: string
  postPosition: number
  sex: string       // "H" | "G" | "M" | "F" | "C" | "R"
  color: string     // "B" | "CH" | "GR/RO" | "DK B/BR" etc.
  age: number
  sire?: string
  dam?: string
  damSire?: string
  owner?: string
  trainer?: string
  jockey?: string
  weightLbs?: number
  morningLine?: number
  lifetime: CareerStats
  currentYear: CareerStats
  previousYear: CareerStats
  turf?: CareerStats
  offTrack?: CareerStats
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
