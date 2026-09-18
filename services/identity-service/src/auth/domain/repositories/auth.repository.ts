import { UserEntity } from '../../../shared/domain/entities/user.entity.js'
import {
  AuthSessionEntity,
  SessionWithUser,
} from '../entities/auth-session.entity.js'
import {
  PasswordResetTokenEntity,
  PasswordResetTokenWithUser,
} from '../entities/password-reset-token.entity.js'
import { UserWithProfileAndRoles } from '../entities/authenticated-user.entity.js'
import { OAuthAccountEntity } from '../entities/oauth-account.entity.js'

export type {
  UserWithProfileAndRoles,
  SessionWithUser,
  PasswordResetTokenWithUser,
  OAuthAccountEntity,
}

export interface CreateOAuthUserRepositoryInput {
  identifier: string
  provider: string
  providerUserId: string
  email: string
  roleCode?: string
}

export interface CreateSessionRepositoryInput {
  id: string
  userId: string
  tokenHash: string
  userAgent?: string
  ipAddress?: string
  expiresAt: Date
}

export interface UpdateSessionTokenRepositoryInput {
  tokenHash: string
  lastUsedAt: Date
  expiresAt: Date
}

export abstract class IAuthRepository {
  abstract findUserByIdentifier(
    identifier: string,
  ): Promise<(UserEntity & { userRoles: { role: { code: string } }[] }) | null>

  abstract findUserById(userId: string): Promise<UserWithProfileAndRoles | null>

  abstract findGrants(
    userId: string,
  ): Promise<{ roles: string[]; permissions: string[] }>

  abstract findSessionWithUser(
    sessionId: string,
  ): Promise<SessionWithUser | null>

  abstract createSession(
    data: CreateSessionRepositoryInput,
  ): Promise<AuthSessionEntity>

  abstract updateSessionToken(
    sessionId: string,
    data: UpdateSessionTokenRepositoryInput,
  ): Promise<AuthSessionEntity>

  abstract revokeSession(sessionId: string): Promise<AuthSessionEntity>

  abstract deleteExpiredSessions(
    now: Date,
    auditRetentionMs: number,
  ): Promise<{ count: number }>

  abstract updateUserPassword(
    userId: string,
    passwordHash: string,
  ): Promise<UserEntity>

  abstract revokeAllOtherUserSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<{ count: number }>

  abstract createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetTokenEntity>

  abstract findActivePasswordResetToken(
    tokenHash: string,
  ): Promise<PasswordResetTokenWithUser | null>

  abstract markPasswordResetTokenAsUsed(
    tokenId: string,
  ): Promise<PasswordResetTokenEntity>

  abstract findUserSessions(userId: string): Promise<AuthSessionEntity[]>

  abstract revokeAll(userId: string): Promise<{ count: number }>

  abstract findUserByEmail(
    email: string,
  ): Promise<UserWithProfileAndRoles | null>

  abstract findOAuthAccount(
    provider: string,
    providerUserId: string,
  ): Promise<OAuthAccountEntity | null>

  abstract linkOAuthAccount(
    userId: string,
    provider: string,
    providerUserId: string,
    email: string,
  ): Promise<OAuthAccountEntity>

  abstract createUserFromOAuth(
    data: CreateOAuthUserRepositoryInput,
  ): Promise<UserWithProfileAndRoles>
}
