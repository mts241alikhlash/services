export function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function seedOf(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1_000_003
  }
  return hash
}

export function schoolDays(count: number, skip = new Set<string>()): Date[] {
  const days: Date[] = []
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)

  let guard = 0
  while (days.length < count && guard++ < count * 4) {
    cursor.setUTCDate(cursor.getUTCDate() - 1)
    if (cursor.getUTCDay() === 0) continue
    if (skip.has(cursor.toISOString().slice(0, 10))) continue
    days.push(new Date(cursor))
  }
  return days.reverse()
}
