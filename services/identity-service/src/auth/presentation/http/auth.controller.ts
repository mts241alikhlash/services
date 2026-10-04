import {
  AuthIntrospectionResponseDto,
  AuthLoginResponseDto,
  AuthMeResponseDto,
  AuthMessageResponseDto,
  AuthPasswordResetRequestResponseDto,
  AuthRefreshResponseDto,
  AuthResultResponseDto,
} from './dto/response/auth-api-response.dto.js'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { SkipThrottle, Throttle } from '@nestjs/throttler'
import { ProvisioningTokenGuard } from '../../../user/guards/provisioning-token.guard.js'
import { IntrospectTokenDto } from './dto/request/introspect-token.dto.js'
import { SsoGoogleLoginUseCase } from '../../application/use-cases/sso-login/sso-google-login.use-case.js'
import { IntrospectTokenUseCase } from '../../application/use-cases/introspect-token/introspect-token.use-case.js'
import type { Request, Response } from 'express'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import { JwtAuthGuard } from '../../index.js'
import { Public } from '../../../core/decorators/public.decorator.js'
import { GoogleAuthGuard } from '../../guards/google-auth.guard.js'
import { SameOriginGuard } from '../../guards/same-origin.guard.js'
import {
  appCookieName,
  centralCookieName,
  sessionCookieOptions,
} from './auth-cookies.js'
import {
  buildCallbackUrl,
  decodeOAuthState,
  parseRedirectAllowlist,
  resolveRedirectOrigin,
} from '../../oauth/oauth-redirect.js'
import { LoginDto } from './dto/request/login.dto.js'
import { ChangePasswordDto } from './dto/request/change-password.dto.js'
import { ForgotPasswordDto } from './dto/request/forgot-password.dto.js'
import { ResetPasswordDto } from './dto/request/reset-password.dto.js'
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case.js'
import { LoginUseCase } from '../../application/use-cases/login/login.use-case.js'
import { LogoutUseCase } from '../../application/use-cases/logout/logout.use-case.js'
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token/refresh-token.use-case.js'
import { OAuthLoginUseCase } from '../../application/use-cases/oauth-login/oauth-login.use-case.js'
import type { OAuthLoginInput } from '../../application/use-cases/oauth-login/oauth-login.input.js'
import { ChangePasswordUseCase } from '../../application/use-cases/change-password/change-password.use-case.js'
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset/request-password-reset.use-case.js'
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password/reset-password.use-case.js'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly introspectTokenUseCase: IntrospectTokenUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly oauthLoginUseCase: OAuthLoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly ssoGoogleLoginUseCase: SsoGoogleLoginUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Throttle({ auth: {} })
  @Post('login')
  @Public()
  @UseGuards(SameOriginGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({
    status: 200,
    description:
      'Login successful — refresh token set as HttpOnly cookie, access token in body',
    type: AuthLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts — try again later',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponseDto> {
    const userAgent = req.headers['user-agent']
    const ipAddress = req.ip ?? req.socket.remoteAddress

    const result = await this.loginUseCase.execute(dto, userAgent, ipAddress)

    this.setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshExpiresInMs,
    )

    return {
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        identifier: result.user.identifier,
        isActive: result.user.isActive,
        roles: result.user.roles,
      },
    }
  }

  @Get('google')
  @Public()
  @Throttle({ auth: {} })
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start Google sign-in' })
  @ApiResponse({ status: 302, description: 'Redirects to Google' })
  googleAuth(): void {
    return
  }

  @Get('google/callback')
  @Public()
  @Throttle({ auth: {} })
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google sign-in callback' })
  @ApiResponse({
    status: 302,
    description:
      'Refresh token cookie set, redirects to the validated return target. signup-disabled redirects without a cookie and without oauthOutcome.',
  })
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const userAgent = req.headers['user-agent']
    const ipAddress = req.ip ?? req.socket.remoteAddress

    const {
      origin: rawOrigin,
      intent,
      realm,
    } = decodeOAuthState(
      typeof req.query.state === 'string' ? req.query.state : undefined,
    )

    if (realm === 'sso') {
      const accounts = this.configService.getOrThrow<string>(
        'SSO_ACCOUNTS_ORIGIN',
      )
      const opened = await this.ssoGoogleLoginUseCase.execute(
        req.user as unknown as Omit<OAuthLoginInput, 'intent'>,
        userAgent,
        ipAddress,
      )
      if (!opened) {
        res.redirect(`${accounts}/login?error=google`)
        return
      }
      res.cookie(
        centralCookieName(this.isProduction),
        opened.token,
        sessionCookieOptions(this.isProduction, opened.maxAgeMs),
      )
      res.redirect(`${accounts}/`)
      return
    }

    const result = await this.oauthLoginUseCase.execute(
      { ...(req.user as unknown as Omit<OAuthLoginInput, 'intent'>), intent },
      userAgent,
      ipAddress,
    )

    const allowlist = parseRedirectAllowlist(
      this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_ALLOWLIST') ?? '',
    )
    const fallback = this.configService.getOrThrow<string>(
      'GOOGLE_OAUTH_SUCCESS_REDIRECT_URL',
    )

    if (
      result.oauthOutcome === 'signup-disabled' ||
      result.oauthOutcome === 'staff-account'
    ) {
      const origin = resolveRedirectOrigin(rawOrigin ?? undefined, allowlist)
      res.redirect(
        buildCallbackUrl(origin, fallback, false, result.oauthOutcome),
      )
      return
    }

    this.setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshExpiresInMs,
    )

    const origin = resolveRedirectOrigin(rawOrigin ?? undefined, allowlist)
    res.redirect(
      buildCallbackUrl(
        origin,
        fallback,
        result.profileIncomplete,
        result.oauthOutcome,
      ),
    )
  }

  @Post('refresh')
  @Public()
  @UseGuards(SameOriginGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Refresh access token using HttpOnly cookie',
    description:
      'Reads `refresh_token` from HttpOnly cookie set during login. Not testable via Swagger UI — use a REST client that supports cookies.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Tokens rotated — new refresh token cookie set, new access token in body',
    type: AuthRefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthRefreshResponseDto> {
    const refreshToken = (req.cookies as Record<string, string>)?.[
      appCookieName(this.isProduction)
    ]
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found')
    }

    const result = await this.refreshTokenUseCase.execute(refreshToken)

    this.setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshExpiresInMs,
    )

    return {
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        identifier: result.user.identifier,
        isActive: result.user.isActive,
      },
    }
  }

  @Post('introspect')
  @Public()
  @UseGuards(ProvisioningTokenGuard)
  @SkipThrottle({ default: true, auth: true })
  @ApiOperation({
    summary: 'Check an access token and return its bearer’s grants',
  })
  @ApiResponse({ status: 200, type: AuthIntrospectionResponseDto })
  async introspect(
    @Body() dto: IntrospectTokenDto,
  ): Promise<AuthIntrospectionResponseDto> {
    return AuthIntrospectionResponseDto.fromDomain(
      await this.introspectTokenUseCase.execute(dto.token),
    )
  }

  @Post('logout')
  @UseGuards(SameOriginGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke current session' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful — session revoked, refresh cookie cleared',
    type: AuthMessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthMessageResponseDto> {
    await this.logoutUseCase.execute(user.sessionId)

    res.clearCookie(
      appCookieName(this.isProduction),
      sessionCookieOptions(this.isProduction),
    )
    res.clearCookie(
      centralCookieName(this.isProduction),
      sessionCookieOptions(this.isProduction),
    )

    return { message: 'Logged out successfully' }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current session identity' })
  @ApiResponse({
    status: 200,
    description: 'Who the caller is and what they may do',
    type: AuthMeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AuthMeResponseDto> {
    return AuthMeResponseDto.fromDomain(
      await this.getProfileUseCase.execute(user.id),
    )
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({
    type: AuthResultResponseDto,
    status: 200,
    description: 'Password successfully changed',
  })
  @ApiResponse({ status: 400, description: 'Invalid passwords' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<AuthResultResponseDto> {
    await this.changePasswordUseCase.execute(user.id, user.sessionId, dto)
    return { success: true, message: 'Password changed successfully' }
  }

  @Throttle({ auth: {} })
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token link' })
  @ApiResponse({
    type: AuthPasswordResetRequestResponseDto,
    status: 200,
    description: 'Forgot password process initiated',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<AuthPasswordResetRequestResponseDto> {
    return AuthPasswordResetRequestResponseDto.fromDomain(
      await this.requestPasswordResetUseCase.execute(dto.identifier),
    )
  }

  @Throttle({ auth: {} })
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with a valid token' })
  @ApiResponse({
    type: AuthResultResponseDto,
    status: 200,
    description: 'Password successfully reset',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<AuthResultResponseDto> {
    await this.resetPasswordUseCase.execute(dto)
    return { success: true, message: 'Password reset successfully' }
  }

  private get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production'
  }

  private setRefreshTokenCookie(res: Response, token: string, maxAge: number) {
    res.cookie(
      appCookieName(this.isProduction),
      token,
      sessionCookieOptions(this.isProduction, maxAge),
    )
  }
}
