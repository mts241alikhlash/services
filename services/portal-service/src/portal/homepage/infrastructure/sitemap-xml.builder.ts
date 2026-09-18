import { SitemapEntryDto } from '../dto/response/page-meta.dto.js'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSitemapXml(
  entries: SitemapEntryDto[],
  baseUrl: string,
): string {
  const base = baseUrl.replace(/\/+$/, '')

  const urls = entries
    .map((entry) => {
      const loc = escapeXml(`${base}${entry.path}`)
      const lastmod = new Date(entry.lastModified).toISOString()
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function buildRobotsTxt(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /login',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n')
}
