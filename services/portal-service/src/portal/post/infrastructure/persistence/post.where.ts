import { ContentStatus, Prisma } from '@prisma/client'
import { PostType } from '../../domain/enums/post-type.enum.js'
import { PENGUMUMAN_TYPE } from '../../constants/post.constants.js'
import {
  PostQueryInput,
  PublicPostQueryInput,
  RelatedPostQueryInput,
} from '../../domain/interfaces/post-repository.interface.js'

export function visiblePostWhere(
  now: Date = new Date(),
): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    status: { in: [ContentStatus.SCHEDULED, ContentStatus.PUBLISHED] },
    publishedAt: { not: null, lte: now },
  }
}

export function dueScheduledWhere(
  now: Date = new Date(),
): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    status: ContentStatus.SCHEDULED,
    publishedAt: { not: null, lte: now },
  }
}

export function activeAnnouncementWhere(
  now: Date = new Date(),
): Prisma.PostWhereInput {
  return {
    ...visiblePostWhere(now),
    type: PostType.PENGUMUMAN,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  }
}

export function expiredAnnouncementWhere(
  now: Date = new Date(),
): Prisma.PostWhereInput {
  return {
    ...visiblePostWhere(now),
    type: PostType.PENGUMUMAN,
    expiresAt: { not: null, lte: now },
  }
}

export function publicPostListWhere(
  type: PostType,
  now: Date = new Date(),
): Prisma.PostWhereInput {
  return { ...visiblePostWhere(now), type }
}

export const PUBLIC_POST_ORDER_BY: Prisma.PostOrderByWithRelationInput[] = [
  { pinnedAt: { sort: 'desc', nulls: 'last' } },
  { publishedAt: 'desc' },
]

export function buildPublicPostWhere(
  query: PublicPostQueryInput,
  now: Date = new Date(),
): Prisma.PostWhereInput {
  const { type, categorySlug, tagSlug, search, expiryScope } = query

  const base =
    type === PENGUMUMAN_TYPE
      ? expiryScope === 'archive'
        ? expiredAnnouncementWhere(now)
        : activeAnnouncementWhere(now)
      : publicPostListWhere(type as PostType, now)

  return {
    ...base,
    ...(categorySlug && { category: { slug: categorySlug, isActive: true } }),
    ...(tagSlug && { tags: { some: { tag: { slug: tagSlug } } } }),
    ...(search && {
      AND: [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
          ],
        },
      ],
    }),
  }
}

export function relatedPostWhere(
  query: Pick<RelatedPostQueryInput, 'type' | 'categoryId'>,
  excludeIds: string[],
  now: Date = new Date(),
  sameCategoryOnly = true,
): Prisma.PostWhereInput {
  return {
    ...publicPostListWhere(query.type as PostType, now),
    id: { notIn: excludeIds },
    ...(sameCategoryOnly && query.categoryId
      ? { categoryId: query.categoryId }
      : {}),
  }
}

export function buildAdminPostWhere(
  query: PostQueryInput,
): Prisma.PostWhereInput {
  const { type, status, categoryId, search, includeDeleted } = query

  return {
    ...(includeDeleted ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(type && { type }),
    ...(status && { status }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }
}
