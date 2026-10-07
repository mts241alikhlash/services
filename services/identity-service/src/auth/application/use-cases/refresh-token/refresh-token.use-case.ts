import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import {
  isUsable,
  slidExpiry,
  withinReuseGrace,
} from '../../../domain/policies/session-lifetime.policy.js'
import { TokenManagerService } from '../../services/token-manager.service.js'

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name)

  constructor(
    private readonly tokenManagerService: TokenManagerService,
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(refreshTokenFromCookie: string) {
    let payload: { sessionId: string }
    try {
      payload = await this.tokenManagerService.verifyRefreshToken(
        refreshTokenFromCookie,
      )
    } catch (err: unknown) {
      this.logger.error('Verify token failed:', err)
      const msg = err instanceof Error ? err.message : String(err)
      throw new UnauthorizedException(`Invalid refresh token: ${msg}`)
    }

    const session = await this.authRepository.findSessionWithUser(
      payload.sessionId,
    )

    const now = new Date()
    if (!session || !isUsable(session, now)) {
      throw new UnauthorizedException('Session expired or revoked')
    }

    if (!session.user.isActive || session.user.deletedAt) {
      throw new UnauthorizedException('User account is deactivated')
    }

    const incomingHash = this.tokenManagerService.hashToken(
      refreshTokenFromCookie,
    )
    const user = {
      id: session.user.id,
      identifier: session.user.identifier,
      isActive: session.user.isActive,
    }
    if (
      !this.tokenManagerService.constantTimeEqual(
        incomingHash,
        session.tokenHash,
      )
    ) {
      if (!this.isJustReplaced(session, incomingHash, now)) {
        await this.authRepository.revokeSession(session.id)
        this.logger.warn(
          `Possible token reuse detected for session ${session.id}. Session revoked.`,
        )
        throw new UnauthorizedException(
          'Token reuse detected. Session revoked.',
        )
      }

      const racedGrants = await this.authRepository.findGrants(session.user.id)
      const { accessToken } = await this.tokenManagerService.generateTokenPair(
        session.user,
        session.id,
        racedGrants,
      )
      this.logger.log(
        `Refresh raced a refresh for session ${session.id}; access token issued, refresh token kept.`,
      )
      return { accessToken, user }
    }

    const grants = await this.authRepository.findGrants(session.user.id)
    const { accessToken, refreshToken: rotatedRefreshToken } =
      await this.tokenManagerService.generateTokenPair(
        session.user,
        session.id,
        grants,
      )

    const newRefreshHash =
      this.tokenManagerService.hashToken(rotatedRefreshToken)
    const idleMs = this.tokenManagerService.getRefreshExpirationMs()
    const expiresAt = slidExpiry(now, idleMs, session.absoluteExpiresAt)
    await this.authRepository.updateSessionToken(session.id, {
      tokenHash: newRefreshHash,
      previousTokenHash: session.tokenHash,
      previousRotatedAt: now,
      lastUsedAt: now,
      expiresAt,
    })
    if (session.parentSessionId && session.parent) {
      await this.authRepository.slideSession(
        session.parentSessionId,
        slidExpiry(now, idleMs, session.parent.absoluteExpiresAt),
      )
    }
    const refreshExpiresInMs = expiresAt.getTime() - now.getTime()

    this.logger.log(`Token rotated for user ${session.user.identifier}`)

    return {
      accessToken,
      refreshToken: rotatedRefreshToken,
      refreshExpiresInMs,
      user,
    }
  }

  private isJustReplaced(
    session: {
      previousTokenHash?: string | null
      previousRotatedAt?: Date | null
    },
    incomingHash: string,
    now: Date,
  ): boolean {
    return (
      !!session.previousTokenHash &&
      withinReuseGrace(session.previousRotatedAt, now) &&
      this.tokenManagerService.constantTimeEqual(
        incomingHash,
        session.previousTokenHash,
      )
    )
  }
}
