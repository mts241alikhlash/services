export async function updateIfVersionMatches<TRow>(
  update: () => Promise<{ count: number }>,
  reload: () => Promise<TRow>,
): Promise<TRow | null> {
  const { count } = await update()
  if (count === 0) return null

  return reload()
}
