import { Injectable } from '@nestjs/common'
import * as crypto from 'node:crypto'
import {
  IAuthRepository,
  SessionWithUser,
} from '../../domain/repositories/auth.repository.js'
import {
  isUsable,
  slidExpiry,
} from '../../domain/policies/session-lifetime.policy.js'
import { TokenManagerService } from './token-manager.service.js'

@Injectable()
export class CentralSessionService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenManager: TokenManagerService,
  ) {}

  async open(userId: string, userAgent?: string, ipAddress?: string) {
    const token = crypto.randomBytes(32).toString('base64url')
    const now = new Date()
    const maxAgeMs = this.tokenManager.getAbsoluteSessionMs()
    const absoluteExpiresAt = new Date(now.getTime() + maxAgeMs)
    await this.authRepository.createSession({
      id: crypto.randomUUID(),
      userId,
      tokenHash: this.tokenManager.hashToken(token),
      userAgent,
      ipAddress,
      expiresAt: slidExpiry(
        now,
        this.tokenManager.getRefreshExpirationMs(),
        absoluteExpiresAt,
      ),
      absoluteExpiresAt,
    })
    return { token, maxAgeMs }
  }

  async find(token: string | undefined): Promise<SessionWithUser | null> {
    if (!token) return null
    const session = await this.authRepository.findSessionByTokenHash(
      this.tokenManager.hashToken(token),
    )
    if (
      !session ||
      session.parentSessionId ||
      !isUsable(session, new Date()) ||
      !session.user.isActive ||
      session.user.deletedAt
    ) {
      return null
    }
    return session
  }
}
