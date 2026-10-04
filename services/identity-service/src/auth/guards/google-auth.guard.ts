import { ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthGuard } from '@nestjs/passport'
import type { AuthGuardAuthenticateOptions } from '@nestjs/passport'
import type { Request } from 'express'
import {
  decodeOAuthState,
  encodeOAuthState,
  parseRedirectAllowlist,
  resolveRedirectOrigin,
} from '../oauth/oauth-redirect.js'
import type { OAuthIntent } from '../oauth/oauth-redirect.js'

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super()
  }

  override getAuthenticateOptions(
    context: ExecutionContext,
  ): AuthGuardAuthenticateOptions & { callbackURL?: string } {
    const request = context.switchToHttp().getRequest<Request>()
    const accounts = this.configService.get<string>('SSO_ACCOUNTS_ORIGIN')
    const state =
      typeof request.query.state === 'string' ? request.query.state : undefined
    const staff =
      request.path === '/sso/google' || decodeOAuthState(state).realm === 'sso'
    if (staff && accounts) {
      return {
        state: encodeOAuthState(accounts, 'signin', 'sso'),
        callbackURL: `${accounts}/auth/google/callback`,
      }
    }
    const redirect = request.query.redirect
    const intent: OAuthIntent =
      request.query.intent === 'signup' ? 'signup' : 'signin'
    const allowlist = parseRedirectAllowlist(
      this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_ALLOWLIST') ?? '',
    )
    const origin = resolveRedirectOrigin(
      typeof redirect === 'string' ? redirect : undefined,
      allowlist,
    )
    return origin ? { state: encodeOAuthState(origin, intent) } : {}
  }
}
