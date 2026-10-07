const MAX = 30

function trimUnderscores(value: string) {
  return value.replace(/^_+|_+$/g, '')
}

export function documentTypeCode(
  name: string,
  taken: ReadonlySet<string>,
): string {
  const base =
    trimUnderscores(
      trimUnderscores(
        name
          .normalize('NFKD')
          .replace(/[̀-ͯ]/g, '')
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_'),
      ).slice(0, MAX),
    ) || 'BERKAS'
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const suffix = `_${n}`
    const candidate =
      trimUnderscores(base.slice(0, MAX - suffix.length)) + suffix
    if (!taken.has(candidate)) return candidate
  }
}
