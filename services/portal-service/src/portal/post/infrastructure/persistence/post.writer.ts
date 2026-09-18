import { ContentStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { PostType } from '../../domain/enums/post-type.enum.js'
import { PostWithDetails } from '../../domain/entities/post.entity.js'
import { dueScheduledWhere } from './post.where.js'
import { POST_INCLUDE, withAuthor } from './post.includes.js'
import {
  CreatePostInput,
  PublishPostInput,
  UpdatePostInput,
} from '../../domain/interfaces/post-repository.interface.js'

export function buildCreateData(
  input: CreatePostInput,
): Prisma.PostUncheckedCreateInput {
  return {
    type: input.type,
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    body: input.body,
    coverFileId: input.coverFileId ?? null,
    coverAltText: input.coverAltText ?? null,
    categoryId: input.categoryId ?? null,
    metaTitle: input.metaTitle ?? null,
    metaDescription: input.metaDescription ?? null,
    expiresAt: input.expiresAt ?? null,
    attachmentFileId: input.attachmentFileId ?? null,
    authorId: input.authorId,
  }
}

export function buildUpdateData(
  input: UpdatePostInput,
): Prisma.PostUncheckedUpdateInput {
  const data: Prisma.PostUncheckedUpdateInput = { version: { increment: 1 } }

  if (input.title !== undefined) data.title = input.title
  if (input.slug !== undefined) data.slug = input.slug
  if (input.summary !== undefined) data.summary = input.summary
  if (input.body !== undefined) data.body = input.body
  if (input.coverFileId !== undefined) data.coverFileId = input.coverFileId
  if (input.coverAltText !== undefined) data.coverAltText = input.coverAltText
  if (input.categoryId !== undefined) data.categoryId = input.categoryId
  if (input.metaTitle !== undefined) data.metaTitle = input.metaTitle
  if (input.metaDescription !== undefined) {
    data.metaDescription = input.metaDescription
  }
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt
  if (input.attachmentFileId !== undefined) {
    data.attachmentFileId = input.attachmentFileId
  }

  return data
}

export function buildPublishData(
  input: PublishPostInput,
): Prisma.PostUncheckedUpdateInput {
  return {
    status: input.status,
    publishedAt: input.publishedAt,
    scheduledAt: input.scheduledAt,
    version: { increment: 1 },
  }
}

export function buildUnpublishData(): Prisma.PostUncheckedUpdateInput {
  return {
    status: ContentStatus.DRAFT,
    publishedAt: null,
    scheduledAt: null,
    version: { increment: 1 },
  }
}

export function buildArchiveData(): Prisma.PostUncheckedUpdateInput {
  return { status: ContentStatus.ARCHIVED, version: { increment: 1 } }
}

export function buildPinData(
  pinnedAt: Date | null,
): Prisma.PostUncheckedUpdateInput {
  return { pinnedAt, version: { increment: 1 } }
}

export async function recordPostSlugHistory(
  prisma: PrismaService,
  postId: string,
  type: `${PostType}`,
  slug: string,
): Promise<void> {
  await prisma.postSlugHistory.upsert({
    where: { type_slug: { type, slug } },
    update: { postId },
    create: { postId, type, slug },
  })
}

export async function normalizeDueScheduledPosts(
  prisma: PrismaService,
  now: Date,
): Promise<number> {
  const { count } = await prisma.post.updateMany({
    where: dueScheduledWhere(now),
    data: { status: ContentStatus.PUBLISHED },
  })
  return count
}

export function softDeletePost(prisma: PrismaService, id: string) {
  return prisma.post.update({ where: { id }, data: { deletedAt: new Date() } })
}

export async function restorePost(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  id: string,
): Promise<PostWithDetails> {
  const row = await prisma.post.update({
    where: { id },
    data: { deletedAt: null },
    include: POST_INCLUDE,
  })
  return withAuthor(row, profileLookupPort)
}
