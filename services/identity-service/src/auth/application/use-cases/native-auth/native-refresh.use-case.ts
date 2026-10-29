import { Injectable, UnauthorizedException } from '@nestjs/common'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { RefreshTokenUseCase } from '../refresh-token/refresh-token.use-case.js'
import { nativeUserAgent } from './native-device.js'

export interface NativeRefreshInput {
  refreshToken: string
  deviceId: string
}

export interface NativeRefreshResult {
  accessToken: string
  refreshToken: string | null
  expiresIn: number
  user: { id: string; name: string; roles: string[] }
}

@Injectable()
export class NativeRefreshUseCase {
  constructor(
    private readonly tokens: TokenManagerService,
    private readonly authRepository: IAuthRepository,
    private readonly refresh: RefreshTokenUseCase,
  ) {}

  async execute(input: NativeRefreshInput): Promise<NativeRefreshResult> {
    let sessionId: string
    try {
      sessionId = (await this.tokens.verifyRefreshToken(input.refreshToken))
        .sessionId
    } catch {
      throw new UnauthorizedException('Sesi tidak valid')
    }

    const session = await this.authRepository.findSessionWithUser(sessionId)
    if (session?.userAgent !== nativeUserAgent(input.deviceId)) {
      throw new UnauthorizedException('Sesi tidak valid')
    }

    const result = await this.refresh.execute(input.refreshToken)
    const [grants, profile] = await Promise.all([
      this.authRepository.findGrants(session.user.id),
      this.authRepository.findUserById(session.user.id),
    ])

    return {
      accessToken: result.accessToken,
      refreshToken:
        ('refreshToken' in result ? result.refreshToken : null) ?? null,
      expiresIn: this.tokens.getAccessExpirationSeconds(),
      user: {
        id: session.user.id,
        name: profile?.profile?.name ?? result.user.identifier,
        roles: grants.roles,
      },
    }
  }
}
