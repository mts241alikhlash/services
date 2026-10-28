export const GRACE_MINUTES = 10

const MS_PER_MINUTE = 60_000

export function computeTimes(input: {
  startedAt: Date
  durationMinutes: number
  scheduleEndsAt: Date
}): { deadline: Date; finalizeAt: Date } {
  const byDuration =
    input.startedAt.getTime() + input.durationMinutes * MS_PER_MINUTE
  const deadline = new Date(
    Math.min(byDuration, input.scheduleEndsAt.getTime()),
  )
  return {
    deadline,
    finalizeAt: new Date(deadline.getTime() + GRACE_MINUTES * MS_PER_MINUTE),
  }
}
