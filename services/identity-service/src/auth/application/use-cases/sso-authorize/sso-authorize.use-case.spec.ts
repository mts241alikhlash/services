import { BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { CentralSessionService } from '../../services/central-session.service.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { SsoAuthorizeUseCase } from './sso-authorize.use-case.js'

describe('SsoAuthorizeUseCase', () => {
  const repository = {
    findGrants: jest.fn(),
    createAuthorizationCode: jest.fn(),
  }
  const sessions = { find: jest.fn() }
  const tokens = { hashToken: jest.fn((value: string) => `hash:${value}`) }
  const config = new ConfigService({
    SSO_ACCOUNTS_ORIGIN: 'https://accounts.test',
    SSO_APPS:
      'account=https://accounts.test/oauth/callback,hr=https://hr.test/oauth/callback',
  })
  const useCase = new SsoAuthorizeUseCase(
    repository as unknown as IAuthRepository,
    tokens as unknown as TokenManagerService,
    sessions as unknown as CentralSessionService,
    config,
  )
  const request = {
    app: 'hr',
    redirectUri: 'https://hr.test/oauth/callback',
    codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    state: 'state-0123456789abcdef',
  }
  const path = '/sso/authorize?app=hr'

  beforeEach(() => jest.clearAllMocks())

  it('refuses an unknown app without redirecting', async () => {
    await expect(
      useCase.execute({ ...request, app: 'payroll' }, 't', path),
    ).rejects.toThrow(BadRequestException)
  })

  it('refuses a redirect URI that is not the registered one', async () => {
    await expect(
      useCase.execute(
        { ...request, redirectUri: 'https://hr.test/oauth/callback/' },
        't',
        path,
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it('sends someone without a central session to the login page', async () => {
    sessions.find.mockResolvedValue(null)

    await expect(useCase.execute(request, undefined, path)).resolves.toBe(
      `https://accounts.test/login?continue=${encodeURIComponent(path)}`,
    )
  })

  it('sends someone without access to the launcher', async () => {
    sessions.find.mockResolvedValue({ id: 'c1', user: { id: 'u1' } })
    repository.findGrants.mockResolvedValue({
      roles: ['TEACHER'],
      permissions: ['students.read'],
    })

    await expect(useCase.execute(request, 't', path)).resolves.toBe(
      'https://accounts.test/?denied=hr',
    )
    expect(repository.createAuthorizationCode).not.toHaveBeenCalled()
  })

  it('returns to the app with a single-use code and the state', async () => {
    sessions.find.mockResolvedValue({ id: 'c1', user: { id: 'u1' } })
    repository.findGrants.mockResolvedValue({
      roles: ['STAFF'],
      permissions: ['presence-scans.read'],
    })

    const location = new URL(await useCase.execute(request, 't', path))

    expect(location.origin + location.pathname).toBe(
      'https://hr.test/oauth/callback',
    )
    expect(location.searchParams.get('state')).toBe(request.state)
    const code = location.searchParams.get('code') ?? ''
    expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const stored = repository.createAuthorizationCode.mock.calls[0][0] as {
      codeHash: string
      parentSessionId: string
      appKey: string
      redirectUri: string
      codeChallenge: string
      expiresAt: Date
    }
    expect(stored).toMatchObject({
      codeHash: `hash:${code}`,
      parentSessionId: 'c1',
      appKey: 'hr',
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
    })
    expect(stored.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(60_000)
  })
})
