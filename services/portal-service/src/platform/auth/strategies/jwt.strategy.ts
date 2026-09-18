import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'
import { IIdentityPort } from '../../identity/identity.port.js'
import type { JwtTokenPayload } from '../types/jwt-token-payload.type.js'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly identity: IIdentityPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    })
  }

  async validate(request: Request, payload: JwtTokenPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type')
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request)
    if (!token) {
      throw new UnauthorizedException('Invalid or expired token')
    }

    const identity = await this.identity.resolve(token)
    if (!identity) {
      throw new UnauthorizedException('Session expired or revoked')
    }

    return {
      id: identity.userId,
      sub: identity.userId,
      identifier: identity.identifier,
      isActive: true,
      sessionId: identity.sessionId,
      roles: identity.roles,
      permissions: identity.permissions,
    }
  }
}
