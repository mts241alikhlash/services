export function sectionOf(code: string | null | undefined): string | null {
  if (!code) return null

  const trimmed = code.trim()
  const separated = /[-_\s]([^-_\s]+)\s*$/.exec(trimmed)
  if (separated?.[1]) return separated[1].toUpperCase()

  const suffixed = /\d+\s*([A-Za-z]+)\s*$/.exec(trimmed)
  if (suffixed?.[1]) return suffixed[1].toUpperCase()

  return null
}

export function isSameSection(
  sourceCode: string | null | undefined,
  targetCode: string | null | undefined,
): boolean {
  const source = sectionOf(sourceCode)
  if (source === null) return false
  return source === sectionOf(targetCode)
}
