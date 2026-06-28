import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseRow, brisDateToDate } from '@/lib/bris-parser'

export const runtime = 'nodejs'
// Allow up to 10 MB for large race card files
export const maxDuration = 60

// Map BRIS single-letter race type → readable string stored in Race.raceType
const RACE_TYPE_MAP: Record<string, string> = {
  A: 'Allowance',
  C: 'Claiming',
  M: 'Maiden Special Weight',
  N: 'Maiden Claiming',
  S: 'Stakes',
  R: 'Starter Allowance',
  T: 'Starter Handicap',
  G: 'Graded Stakes',
  O: 'Optional Claiming',
  I: 'Invitation',
  H: 'Handicap',
  J: 'Juvenile',
}

function mapRaceType(code: string): string {
  return RACE_TYPE_MAP[code.toUpperCase()] ?? code
}

export async function POST(request: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Read uploaded file ────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.name.endsWith('.csv')) {
    return NextResponse.json({ error: 'File must be a .csv' }, { status: 400 })
  }

  const text = await file.text()

  // ── Create DataImport record ──────────────────────────────────────────────────
  const importRecord = await db.dataImport.create({
    data: {
      userId:   session.user.id,
      filename: file.name,
      source:   'brisnet_csv',
      status:   'processing',
    },
  })

  // ── Parse CSV ─────────────────────────────────────────────────────────────────
  const { data: rawRows, errors: parseErrors } = Papa.parse<string[]>(text, {
    header:        false,
    skipEmptyLines: true,
    transform:     (v: string) => v,  // preserve raw strings
  })

  if (parseErrors.length && rawRows.length === 0) {
    await db.dataImport.update({
      where: { id: importRecord.id },
      data:  { status: 'failed', errors: JSON.stringify(parseErrors) },
    })
    return NextResponse.json({ error: 'CSV parse failed', details: parseErrors }, { status: 422 })
  }

  // ── Process rows ──────────────────────────────────────────────────────────────
  let processed = 0
  const rowErrors: string[] = []

  for (const rawCols of rawRows) {
    const row = parseRow(rawCols)
    if (!row) continue

    try {
      const raceDate = brisDateToDate(row.raceDate)
      if (!raceDate) {
        rowErrors.push(`Invalid date ${row.raceDate} in row ${processed + 1}`)
        continue
      }

      // Upsert Track
      const track = await db.track.upsert({
        where:  { code: row.trackCode },
        create: { code: row.trackCode, name: row.trackCode },
        update: {},
      })

      // Upsert Race
      const race = await db.race.upsert({
        where: {
          trackId_raceDate_raceNumber: {
            trackId:    track.id,
            raceDate,
            raceNumber: row.raceNumber,
          },
        },
        create: {
          trackId:    track.id,
          raceDate,
          raceNumber: row.raceNumber,
          distance:   row.distanceYards,
          surface:    row.surface,
          raceType:   mapRaceType(row.raceType),
          purse:      row.purse || null,
          conditions: row.conditionsLong || row.raceNameShort || null,
        },
        update: {
          distance:   row.distanceYards,
          surface:    row.surface,
          raceType:   mapRaceType(row.raceType),
          purse:      row.purse || null,
          conditions: row.conditionsLong || row.raceNameShort || null,
        },
      })

      // Compute foal year: in horse racing, age is as-of Jan 1.
      // Use 0 as sentinel for unknown so the unique (name, foalYear) constraint works.
      const raceYear = raceDate.getUTCFullYear()
      const foalYear = row.horseAge > 0 ? raceYear - row.horseAge : 0

      // Upsert Horse
      const horse = await db.horse.upsert({
        where:  { name_foalYear: { name: row.horseName, foalYear } },
        create: {
          name:       row.horseName,
          sire:       row.sire || null,
          dam:        row.dam || null,
          damSire:    row.damSire || null,
          color:      row.horseColor || null,
          sex:        row.horseSex || null,
          foalYear,
          foalState:  row.stateFoaled || null,
        },
        update: {
          sire:      row.sire || undefined,
          dam:       row.dam  || undefined,
          damSire:   row.damSire || undefined,
          color:     row.horseColor || undefined,
          sex:       row.horseSex || undefined,
          foalState: row.stateFoaled || undefined,
        },
      })

      // Build rawData object — PP card reads this for past race + workout detail
      const rawData = {
        breedType:   row.breedType,
        ownerColors: row.ownerColors,
        sireSire:    row.sireSire,
        breeder:     row.breeder,
        stateFoaled: row.stateFoaled,
        primePower:       row.primePower || null,
        speedParForClass: row.speedParForClass || null,
        bestSpeedFastTrack: row.bestSpeedFastTrack || null,
        bestSpeedOffTrack:  row.bestSpeedOffTrack  || null,
        bestSpeedTurf:      row.bestSpeedTurf      || null,
        bestSpeedDistance:  row.bestSpeedDistance  || null,
        trainerCatStats:    row.trainerCatStats.filter(s => s.starts > 0),
        trainerStats: row.trainerStats,
        jockeyStats:  row.jockeyStats,
        careerStats: {
          lifetime:    { starts: row.lifetimeStarts, wins: row.lifetimeWins, places: row.lifetimePlaces, shows: row.lifetimeShows, earnings: row.lifetimeEarnings },
          currentYear: { year: row.currentYear, starts: row.currStarts, wins: row.currWins, places: row.currPlaces, shows: row.currShows, earnings: row.currEarnings },
          prevYear:    { year: row.prevYear, starts: row.prevStarts, wins: row.prevWins, places: row.prevPlaces, shows: row.prevShows, earnings: row.prevEarnings },
        },
        distStats:  row.distStats,
        trackStats: row.trackStats,
        turfStats:  row.turfStats,
        wetStats:   row.wetStats,
        workouts:  row.workouts,
        pastRaces: row.pastRaces,
      }

      // Upsert Entry
      const entry = await db.entry.upsert({
        where: {
          raceId_postPosition: { raceId: race.id, postPosition: row.postPosition },
        },
        create: {
          raceId:       race.id,
          horseId:      horse.id,
          postPosition: row.postPosition,
          programNumber: row.programNumber,
          jockey:       row.jockeyName || null,
          trainer:      row.trainerName || null,
          owner:        row.ownerName || null,
          weightLbs:    row.weightLbs || null,
          morningLine:  row.morningLine || null,
          rawData,
        },
        update: {
          horseId:      horse.id,
          programNumber: row.programNumber,
          jockey:       row.jockeyName || null,
          trainer:      row.trainerName || null,
          owner:        row.ownerName || null,
          weightLbs:    row.weightLbs || null,
          morningLine:  row.morningLine || null,
          rawData,
        },
      })

      // Recreate SpeedFigure records for this entry's past BRIS speed figures
      // Each figure corresponds to a past race date at the same slot index
      const figuresToCreate = row.pastRaces
        .filter(pr => pr.brisSpeed !== null && pr.date)
        .map(pr => {
          const figDate = brisDateToDate(pr.date)
          return figDate && pr.brisSpeed
            ? { entryId: entry.id, figureType: 'brisnet', value: pr.brisSpeed, raceDate: figDate }
            : null
        })
        .filter(Boolean) as { entryId: string; figureType: string; value: number; raceDate: Date }[]

      if (figuresToCreate.length > 0) {
        await db.speedFigure.deleteMany({ where: { entryId: entry.id, figureType: 'brisnet' } })
        await db.speedFigure.createMany({ data: figuresToCreate })
      }

      processed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      rowErrors.push(`Row ${processed + 1} (${row.horseName}): ${msg}`)
      if (rowErrors.length > 20) break  // stop accumulating after 20 errors
    }
  }

  // ── Finalise import record ────────────────────────────────────────────────────
  const status = rowErrors.length > 0 && processed === 0 ? 'failed' : 'completed'
  await db.dataImport.update({
    where: { id: importRecord.id },
    data: {
      status,
      recordsProcessed: processed,
      errors:           rowErrors.length > 0 ? JSON.stringify(rowErrors) : null,
      completedAt:      new Date(),
    },
  })

  return NextResponse.json({
    importId:  importRecord.id,
    processed,
    errors:    rowErrors,
    status,
  })
}
