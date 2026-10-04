import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { SsoAuthorizeUseCase } from '../../application/use-cases/sso-authorize/sso-authorize.use-case.js'
import { ListSsoAppsUseCase } from '../../application/use-cases/sso-apps/list-sso-apps.use-case.js'
import { SsoExchangeUseCase } from '../../application/use-cases/sso-exchange/sso-exchange.use-case.js'
import { safeRelativePath } from '../../domain/policies/sso-apps.policy.js'
import { Public } from '../../../core/decorators/public.decorator.js'
import { GoogleAuthGuard } from '../../guards/google-auth.guard.js'
import { SameOriginGuard } from '../../guards/same-origin.guard.js'
import { SsoLoginUseCase } from '../../application/use-cases/sso-login/sso-login.use-case.js'
import { LoginDto } from './dto/request/login.dto.js'
import { SsoAuthorizeQueryDto } from './dto/request/sso-authorize-query.dto.js'
import { SsoExchangeDto } from './dto/request/sso-exchange.dto.js'
import {
  SsoAppResponseDto,
  SsoExchangeResponseDto,
} from './dto/response/auth-api-response.dto.js'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import { JwtAuthGuard } from '../../index.js'
import {
  appCookieName,
  centralCookieName,
  sessionCookieOptions,
} from './auth-cookies.js'

@ApiTags('Single sign-on')
@Controller('sso')
export class SsoController {
  constructor(
    private readonly ssoLoginUseCase: SsoLoginUseCase,
    private readonly ssoAuthorizeUseCase: SsoAuthorizeUseCase,
    private readonly ssoExchangeUseCase: SsoExchangeUseCase,
    private readonly listSsoAppsUseCase: ListSsoAppsUseCase,
    private readonly configService: ConfigService,
  ) {}

  private get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production'
  }

  @Post('login')
  @Public()
  @Throttle({ auth: {} })
  @UseGuards(SameOriginGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Staff sign-in that opens the central session' })
  @ApiResponse({ status: 204, description: 'Central session cookie set' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Applicant account' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const opened = await this.ssoLoginUseCase.execute(
      dto,
      req.headers['user-agent'],
      req.ip ?? req.socket.remoteAddress,
    )
    res.cookie(
      centralCookieName(this.isProduction),
      opened.token,
      sessionCookieOptions(this.isProduction, opened.maxAgeMs),
    )
  }

  @Get('google')
  @Public()
  @Throttle({ auth: {} })
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start staff Google sign-in' })
  @ApiResponse({ status: 302, description: 'Redirects to Google' })
  google(): void {
    return
  }

  @Get('start')
  @Public()
  @ApiOperation({ summary: 'Hand an app sign-in over to the accounts host' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to /sso/authorize on accounts',
  })
  start(@Req() req: Request, @Res() res: Response): void {
    const accounts = this.configService.getOrThrow<string>(
      'SSO_ACCOUNTS_ORIGIN',
    )
    const query = new URL(req.originalUrl, 'http://placeholder').search
    res.redirect(302, `${accounts}/sso/authorize${query}`)
  }

  @Get('authorize')
  @Public()
  @ApiOperation({ summary: 'Issue a single-use code to a registered app' })
  @ApiResponse({
    status: 302,
    description: 'To the app, the login page or the launcher',
  })
  @ApiResponse({
    status: 400,
    description: 'Malformed query, unknown app or redirect URI',
  })
  async authorize(
    @Query() query: SsoAuthorizeQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const location = await this.ssoAuthorizeUseCase.execute(
      {
        app: query.app,
        redirectUri: query.redirect_uri,
        codeChallenge: query.code_challenge,
        state: query.state,
      },
      (req.cookies as Record<string, string> | undefined)?.[
        centralCookieName(this.isProduction)
      ],
      req.originalUrl,
    )
    res.redirect(302, location)
  }

  @Get('accounts')
  @Public()
  @ApiOperation({ summary: 'Go to a page on the accounts host' })
  @ApiResponse({
    status: 302,
    description: 'To accounts, at path when it is relative',
  })
  accounts(@Query('path') path: unknown, @Res() res: Response): void {
    const accounts = this.configService.getOrThrow<string>(
      'SSO_ACCOUNTS_ORIGIN',
    )
    res.redirect(302, `${accounts}${safeRelativePath(path) ?? '/'}`)
  }

  @Post('exchange')
  @Public()
  @UseGuards(SameOriginGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trade a single-use code for an app session' })
  @ApiResponse({ status: 200, type: SsoExchangeResponseDto })
  @ApiResponse({ status: 400, description: 'Kode masuk tidak valid' })
  async exchange(
    @Body() dto: SsoExchangeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SsoExchangeResponseDto> {
    const result = await this.ssoExchangeUseCase.execute(
      {
        code: dto.code,
        codeVerifier: dto.code_verifier,
        redirectUri: dto.redirect_uri,
      },
      req.headers['user-agent'],
      req.ip ?? req.socket.remoteAddress,
    )
    res.cookie(
      appCookieName(this.isProduction),
      result.refreshToken,
      sessionCookieOptions(this.isProduction, result.refreshExpiresInMs),
    )
    return { accessToken: result.accessToken }
  }

  @Get('apps')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'The apps the caller may open' })
  @ApiResponse({ status: 200, type: SsoAppResponseDto, isArray: true })
  async apps(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SsoAppResponseDto[]> {
    return this.listSsoAppsUseCase.execute(user.id)
  }
}
