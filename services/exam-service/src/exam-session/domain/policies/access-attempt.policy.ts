export const MAX_FAILURES = 5
export const LOCK_MINUTES = 5

export interface AttemptState {
  failures: number
  lockedUntil: Date | null
}

export function isLocked(state: AttemptState, now: Date): boolean {
  return (
    state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime()
  )
}

export function nextAttemptState(
  state: AttemptState,
  now: Date,
  correct: boolean,
): AttemptState {
  if (correct) return { failures: 0, lockedUntil: null }
  const failures = state.failures + 1
  if (failures >= MAX_FAILURES) {
    return {
      failures: 0,
      lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000),
    }
  }
  return { failures, lockedUntil: state.lockedUntil }
}
