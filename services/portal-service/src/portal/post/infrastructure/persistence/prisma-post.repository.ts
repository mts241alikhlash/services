import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { PostType } from '../../domain/enums/post-type.enum.js'
import {
  CreatePostInput,
  IPostRepository,
  PostQueryInput,
  PostWithDetails,
  PublicPostQueryInput,
  PublishPostInput,
  RelatedPostQueryInput,
  UpdatePostInput,
} from '../../domain/interfaces/post-repository.interface.js'
import { updateIfVersionMatches } from '../../../shared/persistence/optimistic-update.js'
import { POST_INCLUDE, withAuthor } from './post.includes.js'
import {
  findAllPosts,
  findLatestPublicPosts,
  findPostByHistoricalSlug,
  findPublicPostBySlug,
  findPublicPosts,
  findRelatedPosts,
  findTakenPostSlugs,
  findVisiblePostsForSitemap,
} from './post.reader.js'
import {
  buildArchiveData,
  buildCreateData,
  buildPinData,
  buildPublishData,
  buildUnpublishData,
  buildUpdateData,
  normalizeDueScheduledPosts,
  recordPostSlugHistory,
  restorePost,
  softDeletePost,
} from './post.writer.js'

@Injectable()
export class PrismaPostRepository extends IPostRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {
    super()
  }

  async findAll(
    query: PostQueryInput,
  ): Promise<PaginatedResult<PostWithDetails>> {
    return findAllPosts(this.prisma, this.profileLookupPort, query)
  }

  async findById(id: string): Promise<PostWithDetails | null> {
    const row = await this.prisma.post.findFirst({
      where: { id },
      include: POST_INCLUDE,
    })
    return row ? withAuthor(row, this.profileLookupPort) : null
  }

  async findPublic(
    query: PublicPostQueryInput,
    now: Date = new Date(),
  ): Promise<PaginatedResult<PostWithDetails>> {
    return findPublicPosts(this.prisma, this.profileLookupPort, query, now)
  }

  async findPublicBySlug(
    type: `${PostType}`,
    slug: string,
    now: Date = new Date(),
  ): Promise<PostWithDetails | null> {
    return findPublicPostBySlug(
      this.prisma,
      this.profileLookupPort,
      type,
      slug,
      now,
    )
  }

  async findLatestPublic(
    type: `${PostType}`,
    take: number,
    now: Date = new Date(),
  ): Promise<PostWithDetails[]> {
    return findLatestPublicPosts(
      this.prisma,
      this.profileLookupPort,
      type,
      take,
      now,
    )
  }

  async findRelated(
    query: RelatedPostQueryInput,
    now: Date = new Date(),
  ): Promise<PostWithDetails[]> {
    return findRelatedPosts(this.prisma, this.profileLookupPort, query, now)
  }

  async findTakenSlugs(type: `${PostType}`, prefix: string): Promise<string[]> {
    return findTakenPostSlugs(this.prisma, type, prefix)
  }

  async findByHistoricalSlug(type: `${PostType}`, slug: string) {
    return findPostByHistoricalSlug(this.prisma, type, slug)
  }

  async recordSlugHistory(
    postId: string,
    type: `${PostType}`,
    slug: string,
  ): Promise<void> {
    return recordPostSlugHistory(this.prisma, postId, type, slug)
  }

  async findAllVisibleForSitemap(now: Date = new Date()) {
    return findVisiblePostsForSitemap(this.prisma, now)
  }

  async create(data: CreatePostInput): Promise<PostWithDetails> {
    const row = await this.prisma.post.create({
      data: buildCreateData(data),
      include: POST_INCLUDE,
    })
    return withAuthor(row, this.profileLookupPort)
  }

  async update(
    id: string,
    expectedVersion: number,
    data: UpdatePostInput,
  ): Promise<PostWithDetails | null> {
    return this.updateIfVersionMatches(
      id,
      expectedVersion,
      buildUpdateData(data),
    )
  }

  async publish(
    id: string,
    expectedVersion: number,
    data: PublishPostInput,
  ): Promise<PostWithDetails | null> {
    return this.updateIfVersionMatches(
      id,
      expectedVersion,
      buildPublishData(data),
    )
  }

  async unpublish(
    id: string,
    expectedVersion: number,
  ): Promise<PostWithDetails | null> {
    return this.updateIfVersionMatches(
      id,
      expectedVersion,
      buildUnpublishData(),
    )
  }

  async archive(
    id: string,
    expectedVersion: number,
  ): Promise<PostWithDetails | null> {
    return this.updateIfVersionMatches(id, expectedVersion, buildArchiveData())
  }

  async pin(
    id: string,
    expectedVersion: number,
    pinnedAt: Date | null,
  ): Promise<PostWithDetails | null> {
    return this.updateIfVersionMatches(
      id,
      expectedVersion,
      buildPinData(pinnedAt),
    )
  }

  async softDelete(id: string) {
    return softDeletePost(this.prisma, id)
  }

  async restore(id: string): Promise<PostWithDetails> {
    return restorePost(this.prisma, this.profileLookupPort, id)
  }

  async normalizeDueScheduled(now: Date = new Date()): Promise<number> {
    return normalizeDueScheduledPosts(this.prisma, now)
  }

  private async updateIfVersionMatches(
    id: string,
    expectedVersion: number,
    data: Prisma.PostUncheckedUpdateInput,
  ): Promise<PostWithDetails | null> {
    const row = await updateIfVersionMatches(
      () =>
        this.prisma.post.updateMany({
          where: { id, version: expectedVersion, deletedAt: null },
          data,
        }),
      () =>
        this.prisma.post.findFirstOrThrow({
          where: { id },
          include: POST_INCLUDE,
        }),
    )
    return row ? withAuthor(row, this.profileLookupPort) : null
  }
}
