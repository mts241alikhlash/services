import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'node:crypto'
import { OAuthLoginInput } from './oauth-login.input.js'
import type { OAuthOutcome } from '../../../oauth/oauth-redirect.js'
import {
  IAuthRepository,
  UserWithProfileAndRoles,
} from '../../../domain/repositories/auth.repository.js'
import { TokenManagerService } from '../../services/token-manager.service.js'

interface ResolvedUser {
  user: UserWithProfileAndRoles | null
  oauthOutcome?: OAuthOutcome
}

@Injectable()
export class OAuthLoginUseCase {
  private readonly logger = new Logger(OAuthLoginUseCase.name)

  constructor(
    private readonly tokenManagerService: TokenManagerService,
    private readonly authRepository: IAuthRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(
    input: OAuthLoginInput,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const resolved = await this.resolveUser(input)

    if (!resolved.user) {
      return {
        oauthOutcome: 'signup-disabled' as const,
        profileIncomplete: false,
      }
    }

    const user = resolved.user

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account is deactivated')
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

    this.logger.log(
      `User ${user.identifier} logged in via ${input.provider} OAuth`,
    )

    return {
      accessToken,
      refreshToken,
      refreshExpiresInMs,
      profileIncomplete: !user.profile,
      user: {
        id: user.id,
        identifier: user.identifier,
        isActive: user.isActive,
        roles: user.userRoles?.map((ur) => ur.role.code) ?? [],
      },
      ...(resolved.oauthOutcome && { oauthOutcome: resolved.oauthOutcome }),
    }
  }

  private async resolveUser(input: OAuthLoginInput): Promise<ResolvedUser> {
    const existingAccount = await this.authRepository.findOAuthAccount(
      input.provider,
      input.providerUserId,
    )

    if (existingAccount) {
      const user = await this.authRepository.findUserById(
        existingAccount.userId,
      )
      if (!user) {
        throw new UnauthorizedException('User account is deactivated')
      }
      return {
        user,
        ...(input.intent === 'signup' && {
          oauthOutcome: 'signup-existing' as const,
        }),
      }
    }

    if (!input.emailVerified) {
      throw new UnauthorizedException(
        `${input.provider} account email is not verified`,
      )
    }

    const matchedByEmail = await this.authRepository.findUserByEmail(
      input.email,
    )
    if (matchedByEmail) {
      await this.authRepository.linkOAuthAccount(
        matchedByEmail.id,
        input.provider,
        input.providerUserId,
        input.email,
      )
      return {
        user: matchedByEmail,
        ...(input.intent === 'signup' && {
          oauthOutcome: 'signup-existing' as const,
        }),
      }
    }

    if (input.intent === 'signup') {
      const signupEnabled = this.config.get<boolean>('GOOGLE_SIGNUP_ENABLED')
      if (!signupEnabled) {
        return { user: null, oauthOutcome: 'signup-disabled' }
      }

      const user = await this.authRepository.createUserFromOAuth({
        identifier: input.email,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email,
        roleCode: 'APPLICANT',
      })
      return { user, oauthOutcome: 'signup-created' }
    }

    const user = await this.authRepository.createUserFromOAuth({
      identifier: input.email,
      provider: input.provider,
      providerUserId: input.providerUserId,
      email: input.email,
    })
    return { user }
  }
}
