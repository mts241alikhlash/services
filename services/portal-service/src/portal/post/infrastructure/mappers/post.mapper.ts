import { PostWithDetails } from '../../domain/interfaces/post-repository.interface.js'
import {
  PostAdminDetailDto,
  PostAdminSummaryDto,
} from '../../dto/response/post-admin.dto.js'
import {
  PostDetailDto,
  PostSummaryDto,
} from '../../dto/response/post-detail.dto.js'
import { PUBLIC_MEDIA_PATH } from '../../constants/post.constants.js'

function mediaUrl(fileId: string | null | undefined): string | null {
  return fileId ? `${PUBLIC_MEDIA_PATH}/${fileId}` : null
}

function authorName(post: PostWithDetails): string {
  const profileName = post.author?.profile?.name?.trim()
  if (profileName) return profileName

  const identifier = post.author?.identifier?.trim()
  if (identifier) return identifier

  return '—'
}

function firstNonBlank(override: string | null, fallback: string): string {
  const trimmed = override?.trim()
  if (trimmed === undefined || trimmed.length === 0) return fallback
  return trimmed
}

function tags(post: PostWithDetails) {
  return (post.tags ?? []).map((row) => row.tag)
}

export function toPublicDetail(post: PostWithDetails): PostDetailDto {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    body: post.body,
    coverImageUrl: mediaUrl(post.coverFileId),
    coverAltText: post.coverAltText,
    category: post.category,
    authorName: authorName(post),
    publishedAt: post.publishedAt!,
    updatedAt: post.updatedAt,
    expiresAt: post.expiresAt,
    attachmentUrl: mediaUrl(post.attachmentFileId),
    metaTitle: firstNonBlank(post.metaTitle, post.title),
    metaDescription: firstNonBlank(post.metaDescription, post.summary),
    tags: tags(post),
  }
}

export function toPublicSummary(post: PostWithDetails): PostSummaryDto {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    coverImageUrl: mediaUrl(post.coverFileId),
    coverAltText: post.coverAltText,
    category: post.category,
    authorName: authorName(post),
    publishedAt: post.publishedAt!,
    isPinned: post.pinnedAt !== null,
    tags: tags(post),
  }
}

export function toAdminDetail(post: PostWithDetails): PostAdminDetailDto {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    body: post.body,
    coverFileId: post.coverFileId,
    coverAltText: post.coverAltText,
    coverImageUrl: mediaUrl(post.coverFileId),
    category: post.category,
    status: post.status,
    publishedAt: post.publishedAt,
    scheduledAt: post.scheduledAt,
    expiresAt: post.expiresAt,
    attachmentFileId: post.attachmentFileId,
    pinnedAt: post.pinnedAt,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    tags: tags(post),
    authorId: post.authorId,
    authorName: authorName(post),
    version: post.version,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    deletedAt: post.deletedAt,
  }
}

export function toAdminSummary(post: PostWithDetails): PostAdminSummaryDto {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    slug: post.slug,
    status: post.status,
    category: post.category,
    authorName: authorName(post),
    publishedAt: post.publishedAt,
    pinnedAt: post.pinnedAt,
    version: post.version,
    updatedAt: post.updatedAt,
    deletedAt: post.deletedAt,
  }
}
