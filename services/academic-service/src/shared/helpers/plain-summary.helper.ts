export function toPlainSummary(html: string | null, limit = 160): string {
  if (!html) return ''

  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= limit) return text

  const boundary = text.lastIndexOf(' ', limit)
  return `${text.slice(0, boundary > 0 ? boundary : limit)}…`
}
