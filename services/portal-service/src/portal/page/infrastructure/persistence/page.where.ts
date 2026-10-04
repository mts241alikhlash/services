import { ContentStatus, Prisma } from '../../../../generated/prisma/client.js'

export function visiblePageWhere(
  now: Date = new Date(),
): Prisma.PortalPageWhereInput {
  return {
    deletedAt: null,
    status: { in: [ContentStatus.SCHEDULED, ContentStatus.PUBLISHED] },
    publishedAt: { not: null, lte: now },
  }
}
