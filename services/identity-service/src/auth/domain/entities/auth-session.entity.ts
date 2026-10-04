import type { SessionUserRef } from './authenticated-user.entity.js'
import type { SessionLifetime } from '../policies/session-lifetime.policy.js'

export interface AuthSessionEntity {
  id: string
  userId: string
  tokenHash: string
  userAgent?: string | null
  ipAddress?: string | null
  expiresAt: Date
  absoluteExpiresAt: Date
  parentSessionId?: string | null
  appKey?: string | null
  lastUsedAt: Date
  revokedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SessionWithUser extends AuthSessionEntity {
  user: SessionUserRef
  parent?: SessionLifetime | null
}
