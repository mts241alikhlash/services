import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { PENGUMUMAN_TYPE } from '../../constants/post.constants.js'
import { PostType } from '../../domain/enums/post-type.enum.js'
import {
  PostQueryInput,
  PostWithDetails,
  PublicPostQueryInput,
  RelatedPostQueryInput,
} from '../../domain/interfaces/post-repository.interface.js'
import { POST_INCLUDE, withAuthors } from './post.includes.js'
import {
  activeAnnouncementWhere,
  buildAdminPostWhere,
  buildPublicPostWhere,
  PUBLIC_POST_ORDER_BY,
  relatedPostWhere,
  visiblePostWhere,
} from './post.where.js'

async function paginate(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  where: Prisma.PostWhereInput,
  orderBy: Prisma.PostOrderByWithRelationInput[],
  page: number,
  limit: number,
): Promise<PaginatedResult<PostWithDetails>> {
  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: POST_INCLUDE,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    }),
    prisma.post.count({ where }),
  ])

  return {
    data: await withAuthors(rows, profileLookupPort),
    total,
    page,
    limit,
  }
}

export function findAllPosts(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  query: PostQueryInput,
): Promise<PaginatedResult<PostWithDetails>> {
  const { page = 1, limit = 10 } = query
  return paginate(
    prisma,
    profileLookupPort,
    buildAdminPostWhere(query),
    [{ updatedAt: 'desc' }],
    page,
    limit,
  )
}

export function findPublicPosts(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  query: PublicPostQueryInput,
  now: Date,
): Promise<PaginatedResult<PostWithDetails>> {
  const { page = 1, limit = 10 } = query
  return paginate(
    prisma,
    profileLookupPort,
    buildPublicPostWhere(query, now),
    PUBLIC_POST_ORDER_BY,
    page,
    limit,
  )
}

export async function findPublicPostBySlug(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  type: `${PostType}`,
  slug: string,
  now: Date,
): Promise<PostWithDetails | null> {
  const row = await prisma.post.findFirst({
    where: { ...visiblePostWhere(now), type, slug },
    include: POST_INCLUDE,
  })
  if (!row) return null
  const [details] = await withAuthors([row], profileLookupPort)
  return details
}

export async function findLatestPublicPosts(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  type: `${PostType}`,
  take: number,
  now: Date,
): Promise<PostWithDetails[]> {
  const where =
    type === PENGUMUMAN_TYPE
      ? activeAnnouncementWhere(now)
      : { ...visiblePostWhere(now), type }

  const rows = await prisma.post.findMany({
    where,
    include: POST_INCLUDE,
    take,
    orderBy: PUBLIC_POST_ORDER_BY,
  })
  return withAuthors(rows, profileLookupPort)
}

export async function findRelatedPosts(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  query: RelatedPostQueryInput,
  now: Date,
): Promise<PostWithDetails[]> {
  const batch = (where: Prisma.PostWhereInput, take: number) =>
    take <= 0
      ? Promise.resolve([])
      : prisma.post.findMany({
          where,
          include: POST_INCLUDE,
          take,
          orderBy: [{ publishedAt: 'desc' }],
        })

  const picked = query.categoryId
    ? await batch(relatedPostWhere(query, [query.excludeId], now), query.take)
    : []
  if (picked.length >= query.take) return withAuthors(picked, profileLookupPort)

  const excludeIds = [query.excludeId, ...picked.map((post) => post.id)]
  const fill = await batch(
    relatedPostWhere(query, excludeIds, now, false),
    query.take - picked.length,
  )

  return withAuthors([...picked, ...fill], profileLookupPort)
}

export async function findPostByHistoricalSlug(
  prisma: PrismaService,
  type: `${PostType}`,
  slug: string,
): Promise<{ postId: string; currentSlug: string } | null> {
  const row = await prisma.postSlugHistory.findFirst({
    where: { type, slug },
    select: { postId: true, post: { select: { slug: true } } },
  })
  return row ? { postId: row.postId, currentSlug: row.post.slug } : null
}

export async function findVisiblePostsForSitemap(
  prisma: PrismaService,
  now: Date,
): Promise<
  { type: `${PostType}`; slug: string; publishedAt: Date; updatedAt: Date }[]
> {
  const rows = await prisma.post.findMany({
    where: visiblePostWhere(now),
    select: { type: true, slug: true, publishedAt: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  })
  return rows.map((row) => ({ ...row, publishedAt: row.publishedAt! }))
}

export async function findTakenPostSlugs(
  prisma: PrismaService,
  type: `${PostType}`,
  prefix: string,
): Promise<string[]> {
  const rows = await prisma.post.findMany({
    where: { type, slug: { startsWith: prefix } },
    select: { slug: true },
  })
  return rows.map((row) => row.slug)
}
