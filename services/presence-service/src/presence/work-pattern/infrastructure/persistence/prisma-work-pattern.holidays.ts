import { PrismaService } from '../../../../core/database/prisma.service.js'
import { NonWorkingDayEntity } from '../../domain/entities/work-pattern.entity.js'
import {
  NonWorkingDayInput,
  NonWorkingDayQueryInput,
} from '../../domain/interfaces/work-pattern-repository.interface.js'

export async function findNonWorkingDays(
  prisma: PrismaService,
  query: NonWorkingDayQueryInput,
): Promise<NonWorkingDayEntity[]> {
  return prisma.nonWorkingDay.findMany({
    where: {
      deletedAt: null,
      ...((query.from ?? query.to) && {
        date: {
          ...(query.from && { gte: query.from }),
          ...(query.to && { lte: query.to }),
        },
      }),
    },
    orderBy: { date: 'asc' },
  })
}

export async function bulkUpsertNonWorkingDays(
  prisma: PrismaService,
  days: NonWorkingDayInput[],
): Promise<{ imported: number; skipped: number }> {
  if (days.length === 0) return { imported: 0, skipped: 0 }

  const existing = await prisma.nonWorkingDay.findMany({
    where: { date: { in: days.map((day) => day.date) }, deletedAt: null },
    select: { date: true },
  })

  const held = new Set(existing.map((row) => row.date.getTime()))
  const fresh = days.filter((day) => !held.has(day.date.getTime()))

  if (fresh.length > 0) {
    await prisma.nonWorkingDay.createMany({
      data: fresh.map((day) => ({
        date: day.date,
        name: day.name,
        sourceCalendarId: day.sourceCalendarId ?? null,
      })),
    })
  }

  return { imported: fresh.length, skipped: days.length - fresh.length }
}

export async function updateNonWorkingDay(
  prisma: PrismaService,
  id: string,
  name: string,
): Promise<NonWorkingDayEntity> {
  return prisma.nonWorkingDay.update({ where: { id }, data: { name } })
}

export async function deleteNonWorkingDay(
  prisma: PrismaService,
  id: string,
): Promise<void> {
  await prisma.nonWorkingDay.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
