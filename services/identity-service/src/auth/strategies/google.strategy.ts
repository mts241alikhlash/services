import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, Profile } from 'passport-google-oauth20'
import { OAuthLoginInput } from '../application/use-cases/oauth-login/oauth-login.input.js'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    })
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Omit<OAuthLoginInput, 'intent'> {
    const email = profile.emails?.[0]?.value
    if (!email) {
      throw new UnauthorizedException('Google account has no email')
    }

    return {
      provider: 'google',
      providerUserId: profile.id,
      email,
      emailVerified: profile.emails?.[0]?.verified === true,
    }
  }
}
