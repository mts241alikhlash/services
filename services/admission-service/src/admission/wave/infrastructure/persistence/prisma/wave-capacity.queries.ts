import type { Prisma } from '../../../../../generated/prisma/client.js'

export type FilledCountClient = Pick<
  Prisma.TransactionClient,
  'admissionApplication'
>

export const FILLED_APPLICATION_WHERE = {
  deletedAt: null,
  status: { not: 'REJECTED' },
  payment: { is: { status: 'VERIFIED' } },
} satisfies Prisma.AdmissionApplicationWhereInput

export async function countFilledByWave(
  db: FilledCountClient,
  waveIds: string[],
): Promise<Map<string, number>> {
  if (waveIds.length === 0) return new Map()
  const rows = await db.admissionApplication.groupBy({
    by: ['waveId'],
    where: { ...FILLED_APPLICATION_WHERE, waveId: { in: waveIds } },
    _count: { _all: true },
  })
  return new Map(rows.map((row) => [row.waveId, row._count._all]))
}

export async function withFilledCount<T extends { id: string }>(
  db: FilledCountClient,
  waves: T[],
): Promise<(T & { filledCount: number })[]> {
  const counts = await countFilledByWave(
    db,
    waves.map((wave) => wave.id),
  )
  return waves.map((wave) => ({
    ...wave,
    filledCount: counts.get(wave.id) ?? 0,
  }))
}
