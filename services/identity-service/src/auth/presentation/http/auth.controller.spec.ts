import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { Request, Response } from 'express'
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case.js'
import { IntrospectTokenUseCase } from '../../application/use-cases/introspect-token/introspect-token.use-case.js'
import { LoginUseCase } from '../../application/use-cases/login/login.use-case.js'
import { OAuthLoginUseCase } from '../../application/use-cases/oauth-login/oauth-login.use-case.js'
import { LogoutUseCase } from '../../application/use-cases/logout/logout.use-case.js'
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token/refresh-token.use-case.js'
import { ChangePasswordUseCase } from '../../application/use-cases/change-password/change-password.use-case.js'
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset/request-password-reset.use-case.js'
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password/reset-password.use-case.js'
import { AuthController } from './auth.controller.js'

describe('AuthController', () => {
  let controller: AuthController

  const mockIntrospectTokenService = { execute: jest.fn() }
  const mockLoginService = { execute: jest.fn() }
  const mockOAuthLoginService = { execute: jest.fn() }
  const mockRefreshTokenService = { execute: jest.fn() }
  const mockLogoutService = { execute: jest.fn() }
  const mockGetProfileService = { execute: jest.fn() }
  const mockChangePasswordService = { execute: jest.fn() }
  const mockRequestPasswordResetService = { execute: jest.fn() }
  const mockResetPasswordService = { execute: jest.fn() }
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'test'
      if (key === 'GOOGLE_OAUTH_REDIRECT_ALLOWLIST') {
        return 'http://localhost:5173,http://localhost:5175'
      }
      return undefined
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'GOOGLE_OAUTH_SUCCESS_REDIRECT_URL') {
        return 'http://localhost:5173/oauth/callback'
      }
      throw new Error(`Unexpected config key requested in test: ${key}`)
    }),
  }

  const createMockRequest = (
    overrides: Partial<Request> = {},
  ): Partial<Request> => ({
    headers: { 'user-agent': 'jest-test-agent' },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' } as Request['socket'],
    cookies: {},
    ...overrides,
  })

  const createMockResponse = (): Partial<Response> => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: IntrospectTokenUseCase,
          useValue: mockIntrospectTokenService,
        },
        { provide: LoginUseCase, useValue: mockLoginService },
        { provide: OAuthLoginUseCase, useValue: mockOAuthLoginService },
        { provide: RefreshTokenUseCase, useValue: mockRefreshTokenService },
        { provide: LogoutUseCase, useValue: mockLogoutService },
        { provide: GetProfileUseCase, useValue: mockGetProfileService },
        { provide: ChangePasswordUseCase, useValue: mockChangePasswordService },
        {
          provide: RequestPasswordResetUseCase,
          useValue: mockRequestPasswordResetService,
        },
        { provide: ResetPasswordUseCase, useValue: mockResetPasswordService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('login', () => {
    const loginDto = { identifier: 'admin', password: 'password123' }

    it('should return accessToken and user, set refresh cookie', async () => {
      const loginResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshExpiresInMs: 604800000,
        user: {
          id: '1',
          identifier: 'admin',
          isActive: true,
        },
      }
      mockLoginService.execute.mockResolvedValue(loginResult)

      const req = createMockRequest()
      const res = createMockResponse()

      const result = await controller.login(
        loginDto,
        req as Request,
        res as Response,
      )

      expect(result).toEqual({
        accessToken: 'access-token',
        user: loginResult.user,
      })
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/auth',
        }),
      )
    })

    it('should pass userAgent and ipAddress to use case', async () => {
      mockLoginService.execute.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        refreshExpiresInMs: 604800000,
        user: {},
      })

      const req = createMockRequest()
      const res = createMockResponse()

      await controller.login(loginDto, req as Request, res as Response)

      expect(mockLoginService.execute).toHaveBeenCalledWith(
        loginDto,
        'jest-test-agent',
        '127.0.0.1',
      )
    })
  })

  describe('googleAuthCallback', () => {
    it('sets the refresh cookie and redirects with the profile-completion flag', async () => {
      mockOAuthLoginService.execute.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        refreshExpiresInMs: 604800000,
        profileIncomplete: true,
        user: { id: '1', identifier: 'a@example.com', isActive: true },
      })

      const req = createMockRequest({
        user: { provider: 'google' } as any,
        query: {},
      })
      const res = createMockResponse()

      await controller.googleAuthCallback(req as Request, res as Response)

      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'rt',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
      )
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/oauth/callback?profileIncomplete=true',
      )
    })

    it('redirects to the allow-listed return target carried in state', async () => {
      mockOAuthLoginService.execute.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        refreshExpiresInMs: 604800000,
        profileIncomplete: false,
        user: { id: '1', identifier: 'a@example.com', isActive: true },
      })

      const req = createMockRequest({
        user: { provider: 'google' } as any,
        query: { state: 'http://localhost:5175' },
      })
      const res = createMockResponse()

      await controller.googleAuthCallback(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5175/oauth/callback?profileIncomplete=false',
      )
    })

    it('ignores a state origin that is not allow-listed', async () => {
      mockOAuthLoginService.execute.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        refreshExpiresInMs: 604800000,
        profileIncomplete: false,
        user: { id: '1', identifier: 'a@example.com', isActive: true },
      })

      const req = createMockRequest({
        user: { provider: 'google' } as any,
        query: { state: 'https://evil.example.com' },
      })
      const res = createMockResponse()

      await controller.googleAuthCallback(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/oauth/callback?profileIncomplete=false',
      )
    })

    it('redirects with the signup-created outcome and decodes the signed state', async () => {
      mockOAuthLoginService.execute.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        refreshExpiresInMs: 604800000,
        profileIncomplete: false,
        oauthOutcome: 'signup-created',
        user: { id: '1', identifier: 'a@example.com', isActive: true },
      })

      const state = Buffer.from(
        JSON.stringify({
          origin: 'http://localhost:5175',
          intent: 'signup',
        }),
      ).toString('base64url')
      const req = createMockRequest({
        user: { provider: 'google' } as any,
        query: { state },
      })
      const res = createMockResponse()

      await controller.googleAuthCallback(req as Request, res as Response)

      expect(mockOAuthLoginService.execute).toHaveBeenCalledWith(
        expect.objectContaining({ intent: 'signup', provider: 'google' }),
        'jest-test-agent',
        '127.0.0.1',
      )
      expect(res.cookie).toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5175/oauth/callback?profileIncomplete=false&oauthOutcome=signup-created',
      )
    })

    it('skips the cookie for signup-disabled and lands on the origin root', async () => {
      mockOAuthLoginService.execute.mockResolvedValue({
        oauthOutcome: 'signup-disabled',
        profileIncomplete: false,
      })

      const state = Buffer.from(
        JSON.stringify({
          origin: 'http://localhost:5175',
          intent: 'signup',
        }),
      ).toString('base64url')
      const req = createMockRequest({
        user: { provider: 'google' } as any,
        query: { state },
      })
      const res = createMockResponse()

      await controller.googleAuthCallback(req as Request, res as Response)

      expect(res.cookie).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5175/?signup=1&profileIncomplete=false',
      )
    })
  })

  describe('refresh', () => {
    it('should rotate tokens from cookie', async () => {
      const refreshResult = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        refreshExpiresInMs: 604800000,
        user: { id: '1', username: 'admin', role: 'ADMIN', isActive: true },
      }
      mockRefreshTokenService.execute.mockResolvedValue(refreshResult)

      const req = createMockRequest({
        cookies: { refresh_token: 'old-refresh' },
      })
      const res = createMockResponse()

      const result = await controller.refresh(req as Request, res as Response)

      expect(result).toEqual({
        accessToken: 'new-access',
        user: refreshResult.user,
      })
      expect(res.cookie).toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when no refresh cookie', async () => {
      const req = createMockRequest({ cookies: {} })
      const res = createMockResponse()

      await expect(
        controller.refresh(req as Request, res as Response),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('logout', () => {
    it('should revoke session and clear cookie', async () => {
      mockLogoutService.execute.mockResolvedValue(undefined)
      const res = createMockResponse()
      const user = { sessionId: 'session-uuid-1' } as any

      const result = await controller.logout(user, res as Response)

      expect(mockLogoutService.execute).toHaveBeenCalledWith('session-uuid-1')
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/auth',
        }),
      )
      expect(result).toEqual({ message: 'Logged out successfully' })
    })
  })

  describe('getMe', () => {
    it('should return user profile', async () => {
      const profile = {
        id: '1',
        username: 'admin',
        role: 'ADMIN',
        isActive: true,
      }
      mockGetProfileService.execute.mockResolvedValue(profile)

      const result = await controller.getMe({ id: '1' } as any)

      expect(result).toEqual(profile)
      expect(mockGetProfileService.execute).toHaveBeenCalledWith('1')
    })
  })
})
