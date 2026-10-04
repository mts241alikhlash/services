import { BadRequestException, Injectable } from '@nestjs/common'
import * as crypto from 'node:crypto'
import {
  isUsable,
  slidExpiry,
} from '../../../domain/policies/session-lifetime.policy.js'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { TokenManagerService } from '../../services/token-manager.service.js'

export interface SsoExchangeInput {
  code: string
  codeVerifier: string
  redirectUri: string
}

export function pkceChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

function invalid(): BadRequestException {
  return new BadRequestException('Kode masuk tidak valid')
}

@Injectable()
export class SsoExchangeUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenManager: TokenManagerService,
  ) {}

  async execute(
    input: SsoExchangeInput,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const now = new Date()
    const record = await this.authRepository.findAuthorizationCode(
      this.tokenManager.hashToken(input.code),
    )
    if (!record) throw invalid()
    if (record.usedAt) {
      if (record.childSessionId) {
        await this.authRepository.revokeSessionFamily(record.childSessionId)
      }
      throw invalid()
    }
    if (
      record.expiresAt <= now ||
      record.redirectUri !== input.redirectUri ||
      pkceChallenge(input.codeVerifier) !== record.codeChallenge
    ) {
      throw invalid()
    }
    const parent = await this.authRepository.findSessionWithUser(
      record.parentSessionId,
    )
    if (
      !parent ||
      !isUsable(parent, now) ||
      !parent.user.isActive ||
      parent.user.deletedAt
    ) {
      throw invalid()
    }
    const childId = crypto.randomUUID()
    if (
      !(await this.authRepository.claimAuthorizationCode(record.id, childId))
    ) {
      throw invalid()
    }
    const grants = await this.authRepository.findGrants(parent.user.id)
    const { accessToken, refreshToken } =
      await this.tokenManager.generateTokenPair(parent.user, childId, grants)
    const expiresAt = slidExpiry(
      now,
      this.tokenManager.getRefreshExpirationMs(),
      parent.absoluteExpiresAt,
    )
    await this.authRepository.createSession({
      id: childId,
      userId: parent.user.id,
      tokenHash: this.tokenManager.hashToken(refreshToken),
      userAgent,
      ipAddress,
      expiresAt,
      absoluteExpiresAt: parent.absoluteExpiresAt,
      parentSessionId: parent.id,
      appKey: record.appKey,
    })
    return {
      accessToken,
      refreshToken,
      refreshExpiresInMs: expiresAt.getTime() - now.getTime(),
    }
  }
}
