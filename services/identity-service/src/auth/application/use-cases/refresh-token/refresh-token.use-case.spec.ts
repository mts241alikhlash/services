import { UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { RefreshTokenUseCase } from './refresh-token.use-case.js'

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase

  const mockTokenManagerService = {
    verifyRefreshToken: jest.fn(),
    hashToken: jest.fn(),
    constantTimeEqual: jest.fn(),
    generateTokenPair: jest.fn(),
    getRefreshExpirationMs: jest.fn(),
  }

  const mockAuthRepository = {
    findGrants: jest.fn().mockResolvedValue({ roles: [], permissions: [] }),
    findSessionWithUser: jest.fn(),
    revokeSession: jest.fn(),
    updateSessionToken: jest.fn(),
    slideSession: jest.fn(),
  }

  const mockSession = {
    id: 'session-uuid-1',
    tokenHash: 'stored-hash',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86400000),
    absoluteExpiresAt: new Date(Date.now() + 30 * 86400000),
    parentSessionId: null,
    parent: null,
    user: {
      id: 'user-uuid-1',
      identifier: 'admin',
      isActive: true,
      deletedAt: null,
    },
  }

  const mockPayload = {
    sub: 'user-uuid-1',
    sessionId: 'session-uuid-1',
    username: 'admin',
    role: 'ADMIN',
    type: 'refresh' as const,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: TokenManagerService, useValue: mockTokenManagerService },
        { provide: IAuthRepository, useValue: mockAuthRepository },
      ],
    }).compile()

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    function validRefresh() {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockTokenManagerService.hashToken.mockReturnValue('stored-hash')
      mockTokenManagerService.constantTimeEqual.mockReturnValue(true)
      mockTokenManagerService.generateTokenPair.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })
      mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(604800000)
      mockAuthRepository.updateSessionToken.mockResolvedValue({})
    }

    it('refuses an app session whose central session was revoked', async () => {
      validRefresh()
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        ...mockSession,
        parentSessionId: 'central-1',
        parent: {
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          absoluteExpiresAt: new Date(Date.now() + 86400000),
        },
      })

      await expect(useCase.execute('old-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      )
      expect(mockAuthRepository.updateSessionToken).not.toHaveBeenCalled()
    })

    it('refuses a session past its absolute limit', async () => {
      validRefresh()
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        ...mockSession,
        absoluteExpiresAt: new Date(Date.now() - 1000),
      })

      await expect(useCase.execute('old-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('never slides the session past its absolute limit', async () => {
      validRefresh()
      const absoluteExpiresAt = new Date(Date.now() + 3600000)
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        ...mockSession,
        absoluteExpiresAt,
      })

      const result = await useCase.execute('old-refresh-token')

      const update = mockAuthRepository.updateSessionToken.mock.calls[0][1] as {
        expiresAt: Date
      }
      expect(update.expiresAt).toEqual(absoluteExpiresAt)
      expect(result.refreshExpiresInMs).toBeLessThanOrEqual(3600000)
    })

    it('keeps the central session alive while an app is used', async () => {
      validRefresh()
      const parentAbsolute = new Date(Date.now() + 30 * 86400000)
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        ...mockSession,
        parentSessionId: 'central-1',
        parent: {
          revokedAt: null,
          expiresAt: new Date(Date.now() + 1000),
          absoluteExpiresAt: parentAbsolute,
        },
      })

      await useCase.execute('old-refresh-token')

      const [id, expiresAt] = mockAuthRepository.slideSession.mock.calls[0] as [
        string,
        Date,
      ]
      expect(id).toBe('central-1')
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 86400000)
    })

    describe('a refresh that races a refresh', () => {
      function raced(previousRotatedMsAgo: number | null) {
        mockTokenManagerService.verifyRefreshToken.mockResolvedValue(
          mockPayload,
        )
        mockTokenManagerService.hashToken.mockReturnValue('previous-hash')
        mockTokenManagerService.constantTimeEqual.mockImplementation(
          (a: string, b: string) => a === b,
        )
        mockTokenManagerService.generateTokenPair.mockResolvedValue({
          accessToken: 'second-access-token',
          refreshToken: 'must-not-be-used',
        })
        mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(
          604800000,
        )
        mockAuthRepository.findSessionWithUser.mockResolvedValue({
          ...mockSession,
          tokenHash: 'current-hash',
          previousTokenHash: 'previous-hash',
          previousRotatedAt:
            previousRotatedMsAgo === null
              ? null
              : new Date(Date.now() - previousRotatedMsAgo),
        })
      }

      it('lets the token that was just replaced mint an access token, without rotating again', async () => {
        raced(5_000)

        const result = await useCase.execute('previous-token')

        expect(result).toEqual({
          accessToken: 'second-access-token',
          user: {
            id: mockSession.user.id,
            identifier: mockSession.user.identifier,
            isActive: mockSession.user.isActive,
          },
        })
        expect(result).not.toHaveProperty('refreshToken')
        expect(mockAuthRepository.revokeSession).not.toHaveBeenCalled()
        expect(mockAuthRepository.updateSessionToken).not.toHaveBeenCalled()
        expect(mockAuthRepository.slideSession).not.toHaveBeenCalled()
      })

      it('still revokes the session when the replaced token comes back after the window', async () => {
        raced(31_000)

        await expect(useCase.execute('previous-token')).rejects.toThrow(
          UnauthorizedException,
        )
        expect(mockAuthRepository.revokeSession).toHaveBeenCalledWith(
          mockSession.id,
        )
      })

      it('still revokes the session when a replaced token is presented but nothing was ever rotated', async () => {
        raced(null)

        await expect(useCase.execute('previous-token')).rejects.toThrow(
          UnauthorizedException,
        )
        expect(mockAuthRepository.revokeSession).toHaveBeenCalledWith(
          mockSession.id,
        )
      })

      it('revokes the session for a token that is neither the current nor the replaced one', async () => {
        raced(5_000)
        mockTokenManagerService.hashToken.mockReturnValue('stolen-hash')

        await expect(useCase.execute('some-other-token')).rejects.toThrow(
          UnauthorizedException,
        )
        expect(mockAuthRepository.revokeSession).toHaveBeenCalledWith(
          mockSession.id,
        )
      })

      it('does not let the window revive a revoked session', async () => {
        raced(5_000)
        mockAuthRepository.findSessionWithUser.mockResolvedValue({
          ...mockSession,
          tokenHash: 'current-hash',
          previousTokenHash: 'previous-hash',
          previousRotatedAt: new Date(),
          revokedAt: new Date(),
        })

        await expect(useCase.execute('previous-token')).rejects.toThrow(
          UnauthorizedException,
        )
        expect(mockTokenManagerService.generateTokenPair).not.toHaveBeenCalled()
      })
    })

    it('remembers the replaced token and when it was replaced', async () => {
      validRefresh()
      mockAuthRepository.findSessionWithUser.mockResolvedValue(mockSession)
      mockTokenManagerService.hashToken
        .mockReturnValueOnce('stored-hash')
        .mockReturnValueOnce('new-hashed-refresh')

      await useCase.execute('old-refresh-token')

      expect(mockAuthRepository.updateSessionToken).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({
          tokenHash: 'new-hashed-refresh',
          previousTokenHash: 'stored-hash',
          previousRotatedAt: expect.any(Date) as Date,
        }),
      )
    })

    it('should rotate tokens successfully', async () => {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockAuthRepository.findSessionWithUser.mockResolvedValue(mockSession)
      mockTokenManagerService.hashToken.mockReturnValue('stored-hash')
      mockTokenManagerService.constantTimeEqual.mockReturnValue(true)
      mockTokenManagerService.generateTokenPair.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })
      mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(604800000)
      mockAuthRepository.updateSessionToken.mockResolvedValue({})

      const result = await useCase.execute('old-refresh-token')

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        refreshExpiresInMs: 604800000,
        user: {
          id: mockSession.user.id,
          identifier: mockSession.user.identifier,
          isActive: mockSession.user.isActive,
        },
      })
    })

    it('should update session with new token hash', async () => {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockAuthRepository.findSessionWithUser.mockResolvedValue(mockSession)
      mockTokenManagerService.hashToken
        .mockReturnValueOnce('stored-hash')
        .mockReturnValueOnce('new-hashed-refresh')
      mockTokenManagerService.constantTimeEqual.mockReturnValue(true)
      mockTokenManagerService.generateTokenPair.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      })
      mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(604800000)
      mockAuthRepository.updateSessionToken.mockResolvedValue({})

      await useCase.execute('old-refresh-token')

      expect(mockAuthRepository.updateSessionToken).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({
          tokenHash: 'new-hashed-refresh',
        }),
      )
    })

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockTokenManagerService.verifyRefreshToken.mockRejectedValue(
        new Error('jwt expired'),
      )

      await expect(useCase.execute('expired-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException when session not found', async () => {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockAuthRepository.findSessionWithUser.mockResolvedValue(null)

      await expect(useCase.execute('valid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException when session is revoked', async () => {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        ...mockSession,
        revokedAt: new Date(),
      })

      await expect(useCase.execute('valid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException when session is expired', async () => {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() - 86400000),
      })

      await expect(useCase.execute('valid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        ...mockSession,
        user: { ...mockSession.user, isActive: false },
      })

      await expect(useCase.execute('valid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException when user is soft-deleted', async () => {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        ...mockSession,
        user: { ...mockSession.user, deletedAt: new Date() },
      })

      await expect(useCase.execute('valid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should revoke session and throw on token reuse detection', async () => {
      mockTokenManagerService.verifyRefreshToken.mockResolvedValue(mockPayload)
      mockAuthRepository.findSessionWithUser.mockResolvedValue(mockSession)
      mockTokenManagerService.hashToken.mockReturnValue('different-hash')
      mockTokenManagerService.constantTimeEqual.mockReturnValue(false)

      await expect(useCase.execute('reused-token')).rejects.toThrow(
        UnauthorizedException,
      )
      expect(mockAuthRepository.revokeSession).toHaveBeenCalledWith(
        mockSession.id,
      )
    })
  })
})
