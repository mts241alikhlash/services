import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { ContentStatus } from '../enums/content-status.enum.js'
import { PostType } from '../enums/post-type.enum.js'
import { PostEntity, PostWithDetails } from '../entities/post.entity.js'

export type { PostWithDetails }

export interface CreatePostInput {
  type: `${PostType}`
  title: string
  slug: string
  summary: string
  body: string
  coverFileId?: string | null
  coverAltText?: string | null
  categoryId?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  expiresAt?: Date | null
  attachmentFileId?: string | null
  authorId: string
}

export interface UpdatePostInput {
  title?: string
  slug?: string
  summary?: string
  body?: string
  coverFileId?: string | null
  coverAltText?: string | null
  categoryId?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  expiresAt?: Date | null
  attachmentFileId?: string | null
}

export interface PublishPostInput {
  status: `${ContentStatus}`
  publishedAt: Date
  scheduledAt: Date | null
}

export interface PostQueryInput {
  page?: number
  limit?: number
  type?: `${PostType}`
  status?: `${ContentStatus}`
  categoryId?: string
  search?: string
  includeDeleted?: boolean
}

export interface PublicPostQueryInput {
  page?: number
  limit?: number
  type: `${PostType}`
  categorySlug?: string
  tagSlug?: string
  search?: string
  expiryScope?: 'active' | 'archive'
}

export interface RelatedPostQueryInput {
  type: `${PostType}`
  excludeId: string
  categoryId: string | null
  take: number
}

export abstract class IPostRepository {
  abstract findAll(
    query: PostQueryInput,
  ): Promise<PaginatedResult<PostWithDetails>>

  abstract findById(id: string): Promise<PostWithDetails | null>

  abstract findPublic(
    query: PublicPostQueryInput,
    now?: Date,
  ): Promise<PaginatedResult<PostWithDetails>>

  abstract findPublicBySlug(
    type: `${PostType}`,
    slug: string,
    now?: Date,
  ): Promise<PostWithDetails | null>

  abstract findLatestPublic(
    type: `${PostType}`,
    take: number,
    now?: Date,
  ): Promise<PostWithDetails[]>

  abstract findRelated(
    query: RelatedPostQueryInput,
    now?: Date,
  ): Promise<PostWithDetails[]>

  abstract findTakenSlugs(
    type: `${PostType}`,
    prefix: string,
  ): Promise<string[]>

  abstract findByHistoricalSlug(
    type: `${PostType}`,
    slug: string,
  ): Promise<{ postId: string; currentSlug: string } | null>

  abstract recordSlugHistory(
    postId: string,
    type: `${PostType}`,
    slug: string,
  ): Promise<void>

  abstract findAllVisibleForSitemap(
    now?: Date,
  ): Promise<
    { type: `${PostType}`; slug: string; publishedAt: Date; updatedAt: Date }[]
  >

  abstract create(data: CreatePostInput): Promise<PostWithDetails>

  abstract update(
    id: string,
    expectedVersion: number,
    data: UpdatePostInput,
  ): Promise<PostWithDetails | null>

  abstract publish(
    id: string,
    expectedVersion: number,
    data: PublishPostInput,
  ): Promise<PostWithDetails | null>

  abstract unpublish(
    id: string,
    expectedVersion: number,
  ): Promise<PostWithDetails | null>

  abstract archive(
    id: string,
    expectedVersion: number,
  ): Promise<PostWithDetails | null>

  abstract pin(
    id: string,
    expectedVersion: number,
    pinnedAt: Date | null,
  ): Promise<PostWithDetails | null>

  abstract softDelete(id: string): Promise<PostEntity>

  abstract restore(id: string): Promise<PostWithDetails>

  abstract normalizeDueScheduled(now?: Date): Promise<number>
}
