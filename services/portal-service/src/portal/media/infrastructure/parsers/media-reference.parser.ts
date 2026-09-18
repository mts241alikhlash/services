import { PUBLIC_MEDIA_PATH } from '../../../post/constants/post.constants.js'

const MEDIA_REFERENCE = new RegExp(
  `${PUBLIC_MEDIA_PATH.replace(/\//g, '\\/')}\\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})`,
  'g',
)

export function extractMediaIds(html: string): string[] {
  if (!html) return []

  const ids = new Set<string>()
  for (const match of html.matchAll(MEDIA_REFERENCE)) {
    ids.add(match[1].toLowerCase())
  }
  return [...ids]
}
