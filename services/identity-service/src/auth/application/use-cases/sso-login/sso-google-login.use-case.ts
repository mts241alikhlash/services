import { Injectable } from '@nestjs/common'
import { isStaff } from '../../../domain/policies/sso-apps.policy.js'
import { CentralSessionService } from '../../services/central-session.service.js'
import { rolesOf } from '../../services/credentials.service.js'
import type { OAuthLoginInput } from '../oauth-login/oauth-login.input.js'
import { OAuthLoginUseCase } from '../oauth-login/oauth-login.use-case.js'

@Injectable()
export class SsoGoogleLoginUseCase {
  constructor(
    private readonly oauthLogin: OAuthLoginUseCase,
    private readonly centralSessions: CentralSessionService,
  ) {}

  async execute(
    input: Omit<OAuthLoginInput, 'intent'>,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { user } = await this.oauthLogin.resolve({
      ...input,
      intent: 'signin',
    })
    if (!user || !user.isActive || user.deletedAt || !isStaff(rolesOf(user))) {
      return null
    }
    return this.centralSessions.open(user.id, userAgent, ipAddress)
  }
}
