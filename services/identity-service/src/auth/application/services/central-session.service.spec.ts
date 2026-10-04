import { IAuthRepository } from '../../domain/repositories/auth.repository.js'
import { CentralSessionService } from './central-session.service.js'
import { TokenManagerService } from './token-manager.service.js'

describe('CentralSessionService', () => {
  const repository = {
    createSession: jest.fn(),
    findSessionByTokenHash: jest.fn(),
  }
  const tokens = {
    hashToken: jest.fn((value: string) => `hash:${value}`),
    getRefreshExpirationMs: jest.fn().mockReturnValue(7 * 86400000),
    getAbsoluteSessionMs: jest.fn().mockReturnValue(30 * 86400000),
  }
  const service = new CentralSessionService(
    repository as unknown as IAuthRepository,
    tokens as unknown as TokenManagerService,
  )
  const live = {
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86400000),
    absoluteExpiresAt: new Date(Date.now() + 86400000),
    parentSessionId: null,
    parent: null,
    user: { id: 'u1', identifier: 'guru', isActive: true, deletedAt: null },
  }

  beforeEach(() => jest.clearAllMocks())

  it('stores only the hash of an opaque token and caps the session at 30 days', async () => {
    const { token, maxAgeMs } = await service.open('u1')

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(maxAgeMs).toBe(30 * 86400000)
    const created = repository.createSession.mock.calls[0][0] as {
      tokenHash: string
      parentSessionId?: string
      absoluteExpiresAt: Date
    }
    expect(created.tokenHash).toBe(`hash:${token}`)
    expect(created.parentSessionId).toBeUndefined()
  })

  it('finds a live central session by its token', async () => {
    repository.findSessionByTokenHash.mockResolvedValue(live)

    await expect(service.find('t')).resolves.toBe(live)
    expect(repository.findSessionByTokenHash).toHaveBeenCalledWith('hash:t')
  })

  it.each([
    ['no token', undefined, live],
    ['an unknown token', 't', null],
    ['a revoked session', 't', { ...live, revokedAt: new Date() }],
    ['an app session', 't', { ...live, parentSessionId: 'c1' }],
    [
      'a deactivated user',
      't',
      { ...live, user: { ...live.user, isActive: false } },
    ],
  ])('finds nothing for %s', async (_label, token, row) => {
    repository.findSessionByTokenHash.mockResolvedValue(row)

    await expect(service.find(token)).resolves.toBeNull()
  })
})
