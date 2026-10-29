import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { NativeLoginUseCase } from './native-login.use-case.js'
import { NativeLogoutUseCase } from './native-logout.use-case.js'
import { NativeRefreshUseCase } from './native-refresh.use-case.js'
import { CredentialsService } from '../../services/credentials.service.js'

const user = (roles: string[]) => ({
  id: 'u1',
  identifier: '2024001',
  passwordHash: 'h',
  isActive: true,
  deletedAt: null,
  userRoles: roles.map((code) => ({ role: { code } })),
})

describe('native auth', () => {
  const tokens = {
    generateTokenPair: jest.fn(),
    hashToken: jest.fn().mockReturnValue('hash'),
    getRefreshExpirationMs: jest.fn().mockReturnValue(604_800_000),
    getAbsoluteSessionMs: jest.fn().mockReturnValue(30 * 86_400_000),
    getAccessExpirationSeconds: jest.fn().mockReturnValue(900),
    verifyRefreshToken: jest.fn(),
  }
  const repo = {
    findUserByIdentifier: jest.fn(),
    findUserById: jest.fn(),
    findGrants: jest.fn(),
    createSession: jest.fn(),
    findSessionWithUser: jest.fn(),
  }
  const passwords = { validatePassword: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    tokens.hashToken.mockReturnValue('hash')
    tokens.getRefreshExpirationMs.mockReturnValue(604_800_000)
    tokens.getAbsoluteSessionMs.mockReturnValue(30 * 86_400_000)
    tokens.getAccessExpirationSeconds.mockReturnValue(900)
    tokens.generateTokenPair.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    })
    repo.findGrants.mockResolvedValue({ roles: ['STUDENT'], permissions: [] })
    repo.findUserById.mockResolvedValue({
      id: 'u1',
      profile: { name: 'Ahmad Fauzi' },
    })
    passwords.validatePassword.mockResolvedValue(true)
  })

  const credentials = () =>
    new CredentialsService(repo as never, passwords as never)

  describe('login', () => {
    const login = () =>
      new NativeLoginUseCase(credentials(), tokens as never, repo as never)

    it('gives a student tokens in the body and remembers the device', async () => {
      repo.findUserByIdentifier.mockResolvedValue(user(['STUDENT']))

      const result = await login().execute(
        { identifier: '2024001', password: 'x', deviceId: 'dev-1' },
        '10.0.0.1',
      )

      expect(result).toEqual({
        accessToken: 'a',
        refreshToken: 'r',
        expiresIn: 900,
        user: { id: 'u1', name: 'Ahmad Fauzi', roles: ['STUDENT'] },
      })
      expect(repo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          userAgent: 'native:dev-1',
          ipAddress: '10.0.0.1',
        }),
      )
    })

    it('accepts a teacher', async () => {
      repo.findUserByIdentifier.mockResolvedValue(user(['TEACHER']))
      repo.findGrants.mockResolvedValue({ roles: ['TEACHER'], permissions: [] })

      const result = await login().execute({
        identifier: 'g1',
        password: 'x',
        deviceId: 'd',
      })

      expect(result.user.roles).toEqual(['TEACHER'])
    })

    it.each([['APPLICANT'], ['PRINCIPAL'], ['SUPER_ADMIN']])(
      'refuses an account that is only %s',
      async (role) => {
        repo.findUserByIdentifier.mockResolvedValue(user([role]))

        await expect(
          login().execute({ identifier: 'x', password: 'x', deviceId: 'd' }),
        ).rejects.toThrow(ForbiddenException)
        expect(repo.createSession).not.toHaveBeenCalled()
      },
    )

    it('refuses a wrong password before looking at the roles', async () => {
      repo.findUserByIdentifier.mockResolvedValue(user(['STUDENT']))
      passwords.validatePassword.mockResolvedValue(false)

      await expect(
        login().execute({ identifier: 'x', password: 'bad', deviceId: 'd' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('does not issue a refresh token that outlives the absolute session', async () => {
      repo.findUserByIdentifier.mockResolvedValue(user(['STUDENT']))

      await login().execute({ identifier: 'x', password: 'x', deviceId: 'd' })

      const session = repo.createSession.mock.calls[0][0] as {
        expiresAt: Date
        absoluteExpiresAt: Date
      }
      expect(session.expiresAt.getTime()).toBeLessThanOrEqual(
        session.absoluteExpiresAt.getTime(),
      )
    })
  })

  describe('refresh', () => {
    const refreshUseCase = { execute: jest.fn() }
    const refresh = () =>
      new NativeRefreshUseCase(
        tokens as never,
        repo as never,
        refreshUseCase as never,
      )

    beforeEach(() => {
      tokens.verifyRefreshToken.mockResolvedValue({ sessionId: 's1' })
      repo.findSessionWithUser.mockResolvedValue({
        id: 's1',
        userAgent: 'native:dev-1',
        user: { id: 'u1' },
      })
      refreshUseCase.execute.mockResolvedValue({
        accessToken: 'a2',
        refreshToken: 'r2',
        user: { id: 'u1', identifier: '2024001', isActive: true },
      })
    })

    it('rotates the tokens for the same device', async () => {
      const result = await refresh().execute({
        refreshToken: 'r',
        deviceId: 'dev-1',
      })

      expect(result).toEqual({
        accessToken: 'a2',
        refreshToken: 'r2',
        expiresIn: 900,
        user: { id: 'u1', name: 'Ahmad Fauzi', roles: ['STUDENT'] },
      })
    })

    it('answers without a new refresh token when the call raced another refresh', async () => {
      refreshUseCase.execute.mockResolvedValue({
        accessToken: 'a3',
        user: { id: 'u1', identifier: '2024001', isActive: true },
      })

      const result = await refresh().execute({
        refreshToken: 'r',
        deviceId: 'dev-1',
      })

      expect(result.refreshToken).toBeNull()
    })

    it('refuses another device without rotating or revoking anything', async () => {
      await expect(
        refresh().execute({ refreshToken: 'r', deviceId: 'other' }),
      ).rejects.toThrow(UnauthorizedException)
      expect(refreshUseCase.execute).not.toHaveBeenCalled()
    })

    it('refuses a session that did not start in the app', async () => {
      repo.findSessionWithUser.mockResolvedValue({
        id: 's1',
        userAgent: 'Mozilla/5.0',
        user: { id: 'u1' },
      })

      await expect(
        refresh().execute({ refreshToken: 'r', deviceId: 'dev-1' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('refuses a token that does not verify', async () => {
      tokens.verifyRefreshToken.mockRejectedValue(new Error('bad'))

      await expect(
        refresh().execute({ refreshToken: 'x', deviceId: 'dev-1' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('refuses an unknown session', async () => {
      repo.findSessionWithUser.mockResolvedValue(null)

      await expect(
        refresh().execute({ refreshToken: 'r', deviceId: 'dev-1' }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('logout', () => {
    const logoutUseCase = { execute: jest.fn() }
    const logout = () =>
      new NativeLogoutUseCase(tokens as never, logoutUseCase as never)

    it('revokes the session family of a valid refresh token', async () => {
      tokens.verifyRefreshToken.mockResolvedValue({ sessionId: 's1' })

      await logout().execute({ refreshToken: 'r' })

      expect(logoutUseCase.execute).toHaveBeenCalledWith('s1')
    })

    it('does nothing for a token that does not verify', async () => {
      tokens.verifyRefreshToken.mockRejectedValue(new Error('bad'))

      await expect(
        logout().execute({ refreshToken: 'x' }),
      ).resolves.toBeUndefined()
      expect(logoutUseCase.execute).not.toHaveBeenCalled()
    })
  })
})
