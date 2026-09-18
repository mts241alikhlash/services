import { Injectable } from '@nestjs/common'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { JwtTokenPayload } from '../../../types/jwt-token-payload.type.js'

export interface IntrospectionResult {
  active: boolean
  userId?: string
  identifier?: string
  sessionId?: string
  roles?: string[]
  permissions?: string[]
}

@Injectable()
export class IntrospectTokenUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenManager: TokenManagerService,
  ) {}

  async execute(token: string): Promise<IntrospectionResult> {
    let payload: JwtTokenPayload
    try {
      payload = await this.tokenManager.verifyAccessToken(token)
    } catch {
      return { active: false }
    }

    const session = await this.authRepository.findSessionWithUser(
      payload.sessionId,
    )
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return { active: false }
    }
    if (!session.user.isActive || session.user.deletedAt) {
      return { active: false }
    }

    const grants = await this.authRepository.findGrants(session.user.id)

    return {
      active: true,
      userId: session.user.id,
      identifier: session.user.identifier,
      sessionId: session.id,
      roles: grants.roles,
      permissions: grants.permissions,
    }
  }
}
