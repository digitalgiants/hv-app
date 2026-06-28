import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { raceId } = await params
  const body = await request.json() as {
    results: Record<string, number>
    payouts?: { win?: number | null; place?: number | null; show?: number | null }
  }

  if (!body?.results || typeof body.results !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Verify race exists
  const race = await db.race.findUnique({ where: { id: raceId }, select: { id: true } })
  if (!race) return NextResponse.json({ error: 'Race not found' }, { status: 404 })

  // Save payouts on Race if provided
  if (body.payouts) {
    await db.race.update({
      where: { id: raceId },
      data:  { payouts: body.payouts },
    })
  }

  // Update each entry's finishPosition
  const updates = Object.entries(body.results).map(([programNumber, position]) =>
    db.entry.updateMany({
      where: { raceId, programNumber },
      data:  { finishPosition: typeof position === 'number' ? position : null },
    })
  )
  await Promise.all(updates)

  return NextResponse.json({ ok: true })
}
