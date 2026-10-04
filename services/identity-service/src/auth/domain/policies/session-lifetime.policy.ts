export interface SessionLifetime {
  revokedAt?: Date | null
  expiresAt: Date
  absoluteExpiresAt: Date
}

function isLive(session: SessionLifetime, now: Date): boolean {
  return (
    !session.revokedAt &&
    session.expiresAt > now &&
    session.absoluteExpiresAt > now
  )
}

export function isUsable(
  session: SessionLifetime & { parent?: SessionLifetime | null },
  now: Date,
): boolean {
  return (
    isLive(session, now) && (!session.parent || isLive(session.parent, now))
  )
}

export function slidExpiry(
  now: Date,
  idleMs: number,
  absoluteExpiresAt: Date,
): Date {
  return new Date(Math.min(now.getTime() + idleMs, absoluteExpiresAt.getTime()))
}
