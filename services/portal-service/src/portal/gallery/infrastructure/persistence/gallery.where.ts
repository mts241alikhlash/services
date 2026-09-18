import { ContentStatus, Prisma } from '@prisma/client'

export function visibleAlbumWhere(
  now: Date = new Date(),
): Prisma.GalleryAlbumWhereInput {
  return {
    deletedAt: null,
    status: { in: [ContentStatus.SCHEDULED, ContentStatus.PUBLISHED] },
    publishedAt: { not: null, lte: now },
  }
}
