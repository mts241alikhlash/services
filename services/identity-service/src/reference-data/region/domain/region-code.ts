import type { RegionLevelName } from './repositories/region.repository.js'

const LEVEL_BY_DEPTH: RegionLevelName[] = [
  'PROVINCE',
  'REGENCY',
  'DISTRICT',
  'VILLAGE',
]

export interface RegionRecord {
  code: string
  name: string
  level: RegionLevelName
  parentCode: string | null
}

const ROW = /\(\s*'([0-9.]{2,13})'\s*,\s*'((?:[^']|'')*)'\s*\)/g

export function parseRegions(source: string): RegionRecord[] {
  const seen = new Map<string, RegionRecord>()

  for (const line of source.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('--') || trimmed.length === 0) continue

    const matches =
      trimmed.toUpperCase().startsWith('INSERT') || trimmed.startsWith('(')
        ? [...trimmed.matchAll(ROW)].map((m) => [m[1], m[2]] as const)
        : csvRow(trimmed)

    for (const [code, rawName] of matches) {
      const depth = code.split('.').length
      const level = LEVEL_BY_DEPTH[depth - 1]
      if (!level) continue

      seen.set(code, {
        code,
        name: rawName.replace(/''/g, "'").trim(),
        level,
        parentCode: depth === 1 ? null : code.slice(0, code.lastIndexOf('.')),
      })
    }
  }

  return [...seen.values()]
}

function csvRow(line: string): (readonly [string, string])[] {
  const at = line.indexOf(',')
  if (at === -1) return []
  const code = line.slice(0, at).trim().replace(/^"|"$/g, '')
  const name = line
    .slice(at + 1)
    .trim()
    .replace(/^"|"$/g, '')
  if (!/^[0-9.]{2,13}$/.test(code) || name.length === 0) return []
  return [[code, name] as const]
}

export function sortForInsert(records: RegionRecord[]): RegionRecord[] {
  return [...records].sort(
    (a, b) => a.code.split('.').length - b.code.split('.').length,
  )
}
