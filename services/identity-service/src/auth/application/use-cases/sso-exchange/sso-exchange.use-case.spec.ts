import { BadRequestException } from '@nestjs/common'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { pkceChallenge, SsoExchangeUseCase } from './sso-exchange.use-case.js'

const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'

describe('pkceChallenge', () => {
  it('matches RFC 7636 Appendix B', () => {
    expect(pkceChallenge(VERIFIER)).toBe(CHALLENGE)
  })
})

describe('SsoExchangeUseCase', () => {
  const repository = {
    findAuthorizationCode: jest.fn(),
    claimAuthorizationCode: jest.fn(),
    revokeSessionFamily: jest.fn(),
    findSessionWithUser: jest.fn(),
    findGrants: jest
      .fn()
      .mockResolvedValue({ roles: ['STAFF'], permissions: [] }),
    createSession: jest.fn(),
  }
  const tokens = {
    hashToken: jest.fn((value: string) => `hash:${value}`),
    generateTokenPair: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
    getRefreshExpirationMs: jest.fn().mockReturnValue(7 * 86400000),
  }
  const useCase = new SsoExchangeUseCase(
    repository as unknown as IAuthRepository,
    tokens as unknown as TokenManagerService,
  )
  const absolute = new Date(Date.now() + 30 * 86400000)
  const code = {
    id: 'code-1',
    codeHash: 'hash:the-code',
    parentSessionId: 'c1',
    appKey: 'hr',
    redirectUri: 'https://hr.test/oauth/callback',
    codeChallenge: CHALLENGE,
    expiresAt: new Date(Date.now() + 30_000),
    usedAt: null,
    childSessionId: null,
    createdAt: new Date(),
  }
  const parent = {
    id: 'c1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86400000),
    absoluteExpiresAt: absolute,
    parent: null,
    user: { id: 'u1', identifier: 'guru', isActive: true, deletedAt: null },
  }
  const input = {
    code: 'the-code',
    codeVerifier: VERIFIER,
    redirectUri: 'https://hr.test/oauth/callback',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    repository.findAuthorizationCode.mockResolvedValue(code)
    repository.findSessionWithUser.mockResolvedValue(parent)
    repository.claimAuthorizationCode.mockResolvedValue(true)
  })

  it('creates an app session under the central session', async () => {
    const result = await useCase.execute(input, 'ua', '1.2.3.4')

    expect(result.accessToken).toBe('access')
    const created = repository.createSession.mock.calls[0][0] as {
      id: string
      parentSessionId: string
      appKey: string
      absoluteExpiresAt: Date
      tokenHash: string
    }
    expect(created).toMatchObject({
      parentSessionId: 'c1',
      appKey: 'hr',
      absoluteExpiresAt: absolute,
      tokenHash: 'hash:refresh',
    })
    expect(repository.claimAuthorizationCode).toHaveBeenCalledWith(
      'code-1',
      created.id,
    )
  })

  it('refuses a replayed code and revokes what its first use created', async () => {
    repository.findAuthorizationCode.mockResolvedValue({
      ...code,
      usedAt: new Date(),
      childSessionId: 'app-1',
    })

    await expect(useCase.execute(input)).rejects.toThrow(
      new BadRequestException('Kode masuk tidak valid'),
    )
    expect(repository.revokeSessionFamily).toHaveBeenCalledWith('app-1')
    expect(repository.createSession).not.toHaveBeenCalled()
  })

  it.each([
    ['an unknown code', { find: null }],
    [
      'an expired code',
      { find: { ...code, expiresAt: new Date(Date.now() - 1) } },
    ],
    ['a wrong verifier', { input: { codeVerifier: `${VERIFIER}x` } }],
    [
      'another redirect URI',
      { input: { redirectUri: 'https://evil.test/oauth/callback' } },
    ],
    [
      'a revoked central session',
      { parent: { ...parent, revokedAt: new Date() } },
    ],
    ['a lost race for the code', { claimed: false }],
  ])('refuses %s', async (_label, variant) => {
    if ('find' in variant) {
      repository.findAuthorizationCode.mockResolvedValue(variant.find)
    }
    if ('parent' in variant) {
      repository.findSessionWithUser.mockResolvedValue(variant.parent)
    }
    if ('claimed' in variant) {
      repository.claimAuthorizationCode.mockResolvedValue(variant.claimed)
    }

    await expect(
      useCase.execute({
        ...input,
        ...('input' in variant ? variant.input : {}),
      }),
    ).rejects.toThrow(BadRequestException)
    expect(repository.createSession).not.toHaveBeenCalled()
  })
})
