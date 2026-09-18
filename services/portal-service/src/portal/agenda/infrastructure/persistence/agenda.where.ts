import { ContentStatus, Prisma } from '@prisma/client'
import { AgendaScope } from '../../domain/interfaces/agenda-repository.interface.js'

export function visibleAgendaWhere(
  now: Date = new Date(),
): Prisma.AgendaEntryWhereInput {
  return {
    deletedAt: null,
    status: { in: [ContentStatus.SCHEDULED, ContentStatus.PUBLISHED] },
    publishedAt: { not: null, lte: now },
  }
}

export function agendaScopeWhere(
  scope: AgendaScope,
  now: Date = new Date(),
): Prisma.AgendaEntryWhereInput {
  return {
    ...visibleAgendaWhere(now),
    endTime: scope === 'upcoming' ? { gte: now } : { lt: now },
  }
}

export function agendaScopeOrder(
  scope: AgendaScope,
): Prisma.AgendaEntryOrderByWithRelationInput[] {
  return scope === 'upcoming' ? [{ startTime: 'asc' }] : [{ startTime: 'desc' }]
}

export function buildAdminAgendaWhere(query: {
  status?: string
  search?: string
  includeDeleted?: boolean
}): Prisma.AgendaEntryWhereInput {
  const { status, search, includeDeleted } = query

  return {
    ...(includeDeleted ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(status && { status: status as ContentStatus }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }
}
