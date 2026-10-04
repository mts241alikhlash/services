import { PageMetaDto } from '../dto/response/page-meta.dto.js'
import { PORTAL_DEFAULT_META } from '../constants/meta.constants.js'

export const META_BLOCK_START = '<!-- speckit:meta:start -->'
export const META_BLOCK_END = '<!-- speckit:meta:end -->'

const SITE_NAME = 'MTs Persis 241 Al-Ikhlash'

function attr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function tag(kind: 'property' | 'name', key: string, value: string): string {
  return `<meta ${kind}="${key}" content="${attr(value)}" />`
}

export function buildMetaTags(meta: PageMetaDto | null): string {
  const resolved = meta ?? {
    ...PORTAL_DEFAULT_META,
    canonicalUrl: '',
    imageUrl: null,
    type: 'website' as const,
    publishedAt: null,
  }

  const tags = [
    `<title>${attr(resolved.title)}</title>`,
    tag('name', 'description', resolved.description),
    tag('property', 'og:site_name', SITE_NAME),
    tag('property', 'og:title', resolved.title),
    tag('property', 'og:description', resolved.description),
    tag('property', 'og:type', resolved.type),
  ]

  if (resolved.canonicalUrl) {
    tags.push(tag('property', 'og:url', resolved.canonicalUrl))
    tags.push(`<link rel="canonical" href="${attr(resolved.canonicalUrl)}" />`)
  }

  if (resolved.imageUrl) {
    tags.push(tag('property', 'og:image', resolved.imageUrl))
    tags.push(tag('property', 'og:image:width', '1200'))
    tags.push(tag('property', 'og:image:height', '630'))
  }

  tags.push(
    tag(
      'name',
      'twitter:card',
      resolved.imageUrl ? 'summary_large_image' : 'summary',
    ),
  )

  if (resolved.publishedAt) {
    tags.push(
      tag(
        'property',
        'article:published_time',
        new Date(resolved.publishedAt).toISOString(),
      ),
    )
  }

  return tags.join('\n    ')
}

export function injectMeta(html: string, meta: PageMetaDto | null): string {
  const start = html.indexOf(META_BLOCK_START)
  const end = html.indexOf(META_BLOCK_END)
  if (start === -1 || end === -1 || end < start) return html

  return (
    html.slice(0, start) +
    META_BLOCK_START +
    '\n    ' +
    buildMetaTags(meta) +
    '\n    ' +
    html.slice(end)
  )
}
