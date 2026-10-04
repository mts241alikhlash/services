import { ContentStatus, Prisma } from '../../../../generated/prisma/client.js'

export function visibleAlbumWhere(
  now: Date = new Date(),
): Prisma.GalleryAlbumWhereInput {
  return {
    deletedAt: null,
    status: { in: [ContentStatus.SCHEDULED, ContentStatus.PUBLISHED] },
    publishedAt: { not: null, lte: now },
  }
}
