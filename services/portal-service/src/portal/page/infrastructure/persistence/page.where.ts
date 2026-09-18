import { ContentStatus, Prisma } from '@prisma/client'

export function visiblePageWhere(
  now: Date = new Date(),
): Prisma.PortalPageWhereInput {
  return {
    deletedAt: null,
    status: { in: [ContentStatus.SCHEDULED, ContentStatus.PUBLISHED] },
    publishedAt: { not: null, lte: now },
  }
}
