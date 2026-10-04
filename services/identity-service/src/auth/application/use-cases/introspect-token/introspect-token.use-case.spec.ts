import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { IntrospectTokenUseCase } from './introspect-token.use-case.js'

describe('IntrospectTokenUseCase', () => {
  const repository = {
    findSessionWithUser: jest.fn(),
    findGrants: jest
      .fn()
      .mockResolvedValue({ roles: ['TEACHER'], permissions: [] }),
  }
  const tokens = {
    verifyAccessToken: jest.fn().mockResolvedValue({ sessionId: 'app-1' }),
  }
  const useCase = new IntrospectTokenUseCase(
    repository as unknown as IAuthRepository,
    tokens as unknown as TokenManagerService,
  )
  const user = {
    id: 'user-1',
    identifier: 'guru',
    isActive: true,
    deletedAt: null,
  }
  const live = {
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86400000),
    absoluteExpiresAt: new Date(Date.now() + 86400000),
  }

  it('answers active for an app session with a live central session', async () => {
    repository.findSessionWithUser.mockResolvedValue({
      ...live,
      id: 'app-1',
      user,
      parent: live,
    })

    await expect(useCase.execute('token')).resolves.toMatchObject({
      active: true,
    })
  })

  it('answers inactive once the central session is revoked', async () => {
    repository.findSessionWithUser.mockResolvedValue({
      ...live,
      id: 'app-1',
      user,
      parent: { ...live, revokedAt: new Date() },
    })

    await expect(useCase.execute('token')).resolves.toEqual({ active: false })
  })
})
