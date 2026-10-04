const MAX_SLUG_LENGTH = 220

const COMBINING_MARKS = /[̀-ͯ]/g
const NON_ALPHANUMERIC = /[^a-z0-9]+/g
const EDGE_HYPHENS = /^-+|-+$/g
const TRAILING_HYPHENS = /-+$/g

export function toSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, '-')
    .replace(EDGE_HYPHENS, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(TRAILING_HYPHENS, '')
}

export function toUniqueSlug(value: string, taken: readonly string[]): string {
  const base = toSlug(value)
  if (base.length === 0) {
    throw new Error('Slug source produced an empty slug')
  }

  const used = new Set(taken)
  if (!used.has(base)) return base

  for (let suffix = 2; ; suffix++) {
    const room = MAX_SLUG_LENGTH - String(suffix).length - 1
    const candidate = `${base.slice(0, room).replace(TRAILING_HYPHENS, '')}-${suffix}`
    if (!used.has(candidate)) return candidate
  }
}
