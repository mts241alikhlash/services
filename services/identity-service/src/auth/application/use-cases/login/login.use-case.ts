import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import * as crypto from 'node:crypto'
import { LoginInput } from './login.input.js'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { PasswordManagerService } from '../../services/password-manager.service.js'
import { TokenManagerService } from '../../services/token-manager.service.js'

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name)

  constructor(
    private readonly passwordManagerService: PasswordManagerService,
    private readonly tokenManagerService: TokenManagerService,
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const user = await this.authRepository.findUserByIdentifier(
      input.identifier,
    )

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isValid = await this.passwordManagerService.validatePassword(
      input.password,
      user.passwordHash,
    )
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const sessionId = crypto.randomUUID()
    const grants = await this.authRepository.findGrants(user.id)
    const { accessToken, refreshToken } =
      await this.tokenManagerService.generateTokenPair(user, sessionId, grants)

    const refreshTokenHash = this.tokenManagerService.hashToken(refreshToken)
    const refreshExpiresInMs = this.tokenManagerService.getRefreshExpirationMs()
    const expiresAt = new Date(Date.now() + refreshExpiresInMs)

    await this.authRepository.createSession({
      id: sessionId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
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
        roles: user.userRoles?.map((ur) => ur.role.code) ?? [],
      },
    }
  }
}
