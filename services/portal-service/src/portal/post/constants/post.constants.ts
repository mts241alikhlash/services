import { ContentStatus } from '../domain/enums/content-status.enum.js'
import { PostType } from '../domain/enums/post-type.enum.js'

export const PUBLIC_MEDIA_PATH = '/portal/public/media'

export const REQUIRED_TO_PUBLISH = [
  'title',
  'summary',
  'body',
  'categoryId',
  'coverFileId',
] as const

export const DEFAULT_PAGE_SIZE = 10

export const RELATED_POST_LIMIT = 4

export const RESTORE_WINDOW_DAYS = 30

export const AUDIT_RESOURCE = 'portal-post'

export const POST_AUDIT_ACTIONS = {
  PUBLISH: 'portal-post.publish',
  UNPUBLISH: 'portal-post.unpublish',
  DELETE: 'portal-post.delete',
} as const

export type PostAuditAction =
  (typeof POST_AUDIT_ACTIONS)[keyof typeof POST_AUDIT_ACTIONS]

export const PENGUMUMAN_TYPE: `${PostType}` = PostType.PENGUMUMAN
export const PUBLISHED_STATUS: `${ContentStatus}` = ContentStatus.PUBLISHED

export const PUBLIC_PATH_TO_POST_TYPE: Record<string, `${PostType}`> = {
  berita: PostType.BERITA,
  artikel: PostType.ARTIKEL,
  pengumuman: PostType.PENGUMUMAN,
}

export const POST_TYPE_TO_PUBLIC_PATH: Record<`${PostType}`, string> = {
  [PostType.BERITA]: 'berita',
  [PostType.ARTIKEL]: 'artikel',
  [PostType.PENGUMUMAN]: 'pengumuman',
}

export function postTypeFromPath(segment: string): `${PostType}` | null {
  return PUBLIC_PATH_TO_POST_TYPE[segment.toLowerCase()] ?? null
}
