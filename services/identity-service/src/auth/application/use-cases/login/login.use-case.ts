import { ForbiddenException, Injectable, Logger } from '@nestjs/common'
import * as crypto from 'node:crypto'
import { LoginInput } from './login.input.js'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { isApplicant } from '../../../domain/policies/sso-apps.policy.js'
import {
  CredentialsService,
  rolesOf,
} from '../../services/credentials.service.js'
import { slidExpiry } from '../../../domain/policies/session-lifetime.policy.js'
import { TokenManagerService } from '../../services/token-manager.service.js'

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name)

  constructor(
    private readonly credentials: CredentialsService,
    private readonly tokenManagerService: TokenManagerService,
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const user = await this.credentials.verify(input.identifier, input.password)
    const roles = rolesOf(user)
    if (!isApplicant(roles)) {
      throw new ForbiddenException('Staf masuk lewat akun sekolah')
    }

    const sessionId = crypto.randomUUID()
    const grants = await this.authRepository.findGrants(user.id)
    const { accessToken, refreshToken } =
      await this.tokenManagerService.generateTokenPair(user, sessionId, grants)

    const refreshTokenHash = this.tokenManagerService.hashToken(refreshToken)
    const now = new Date()
    const absoluteExpiresAt = new Date(
      now.getTime() + this.tokenManagerService.getAbsoluteSessionMs(),
    )
    const expiresAt = slidExpiry(
      now,
      this.tokenManagerService.getRefreshExpirationMs(),
      absoluteExpiresAt,
    )
    const refreshExpiresInMs = expiresAt.getTime() - now.getTime()

    await this.authRepository.createSession({
      id: sessionId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
      absoluteExpiresAt,
    })

    this.logger.log(`User ${user.identifier} logged in successfully`)

    return {
      accessToken,
      refreshToken,
      refreshExpiresInMs,
      user: {
        id: user.id,
        identifier: user.identifier,
        isActive: user.isActive,
        roles,
      },
    }
  }
}
