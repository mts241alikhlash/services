import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'node:crypto'
import {
  canOpenApp,
  isSsoAppKey,
  parseSsoApps,
} from '../../../domain/policies/sso-apps.policy.js'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { CentralSessionService } from '../../services/central-session.service.js'
import { TokenManagerService } from '../../services/token-manager.service.js'

export interface SsoAuthorizeRequest {
  app: string
  redirectUri: string
  codeChallenge: string
  state: string
}

const CODE_LIFETIME_MS = 60_000

@Injectable()
export class SsoAuthorizeUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenManager: TokenManagerService,
    private readonly centralSessions: CentralSessionService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    request: SsoAuthorizeRequest,
    centralToken: string | undefined,
    requestPath: string,
  ): Promise<string> {
    const apps = parseSsoApps(this.config.getOrThrow<string>('SSO_APPS'))
    if (
      !isSsoAppKey(request.app) ||
      apps.get(request.app) !== request.redirectUri
    ) {
      throw new BadRequestException(
        'Aplikasi atau alamat kembali tidak terdaftar',
      )
    }
    const accounts = this.config.getOrThrow<string>('SSO_ACCOUNTS_ORIGIN')
    const session = await this.centralSessions.find(centralToken)
    if (!session) {
      return `${accounts}/login?continue=${encodeURIComponent(requestPath)}`
    }
    const grants = await this.authRepository.findGrants(session.user.id)
    if (!canOpenApp(request.app, grants)) {
      return `${accounts}/?denied=${request.app}`
    }
    const code = crypto.randomBytes(32).toString('base64url')
    await this.authRepository.createAuthorizationCode({
      codeHash: this.tokenManager.hashToken(code),
      parentSessionId: session.id,
      appKey: request.app,
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
      expiresAt: new Date(Date.now() + CODE_LIFETIME_MS),
    })
    const location = new URL(request.redirectUri)
    location.searchParams.set('code', code)
    location.searchParams.set('state', request.state)
    return location.toString()
  }
}
