import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { OAuthLoginUseCase } from './oauth-login.use-case.js'
import type { OAuthLoginInput } from './oauth-login.input.js'

describe('OAuthLoginUseCase', () => {
  let useCase: OAuthLoginUseCase

  const mockTokenManagerService = {
    generateTokenPair: jest.fn(),
    hashToken: jest.fn(),
    getRefreshExpirationMs: jest.fn(),
  }

  const mockAuthRepository = {
    findOAuthAccount: jest.fn(),
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    linkOAuthAccount: jest.fn(),
    createUserFromOAuth: jest.fn(),
    findGrants: jest.fn(),
    createSession: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockUser = {
    id: 'user-uuid-1',
    identifier: 'a@example.com',
    passwordHash: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: null,
    userRoles: [],
  }

  function input(intent: 'signin' | 'signup'): OAuthLoginInput {
    return {
      provider: 'google',
      providerUserId: 'google-1',
      email: 'a@example.com',
      emailVerified: true,
      intent,
    }
  }

  function arrangeSigningIn() {
    mockTokenManagerService.generateTokenPair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })
    mockTokenManagerService.hashToken.mockReturnValue('hashed-refresh')
    mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(604800000)
    mockAuthRepository.findGrants.mockResolvedValue({
      roles: [],
      permissions: [],
    })
    mockAuthRepository.createSession.mockResolvedValue({})
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthLoginUseCase,
        { provide: TokenManagerService, useValue: mockTokenManagerService },
        { provide: IAuthRepository, useValue: mockAuthRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    useCase = module.get<OAuthLoginUseCase>(OAuthLoginUseCase)

    jest.clearAllMocks()
    mockConfigService.get.mockReturnValue(undefined)
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('signin intent', () => {
    it('creates a roleless account for an unknown email and starts a session', async () => {
      mockAuthRepository.findOAuthAccount.mockResolvedValue(null)
      mockAuthRepository.findUserByEmail.mockResolvedValue(null)
      mockAuthRepository.createUserFromOAuth.mockResolvedValue({
        ...mockUser,
        userRoles: [{ roleId: 'role-x', role: { code: 'USER' } }],
      })
      arrangeSigningIn()

      const result = await useCase.execute(input('signin'))

      expect(mockAuthRepository.createUserFromOAuth).toHaveBeenCalledWith({
        identifier: 'a@example.com',
        provider: 'google',
        providerUserId: 'google-1',
        email: 'a@example.com',
      })
      expect(mockAuthRepository.createSession).toHaveBeenCalled()
      expect(result).toMatchObject({ accessToken: 'access-token' })
      expect(result).not.toHaveProperty('oauthOutcome')
    })
  })

  describe('signup intent', () => {
    it('creates an APPLICANT account when the flag is on', async () => {
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'GOOGLE_SIGNUP_ENABLED' ? true : undefined,
      )
      mockAuthRepository.findOAuthAccount.mockResolvedValue(null)
      mockAuthRepository.findUserByEmail.mockResolvedValue(null)
      mockAuthRepository.createUserFromOAuth.mockResolvedValue({
        ...mockUser,
        userRoles: [{ roleId: 'role-a', role: { code: 'APPLICANT' } }],
      })
      arrangeSigningIn()

      const result = await useCase.execute(input('signup'))

      expect(mockAuthRepository.createUserFromOAuth).toHaveBeenCalledWith({
        identifier: 'a@example.com',
        provider: 'google',
        providerUserId: 'google-1',
        email: 'a@example.com',
        roleCode: 'APPLICANT',
      })
      expect(mockAuthRepository.createSession).toHaveBeenCalled()
      expect(result.oauthOutcome).toBe('signup-created')
    })

    it('does not create or start a session when the flag is off', async () => {
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'GOOGLE_SIGNUP_ENABLED' ? false : undefined,
      )
      mockAuthRepository.findOAuthAccount.mockResolvedValue(null)
      mockAuthRepository.findUserByEmail.mockResolvedValue(null)

      const result = await useCase.execute(input('signup'))

      expect(mockAuthRepository.createUserFromOAuth).not.toHaveBeenCalled()
      expect(mockAuthRepository.createSession).not.toHaveBeenCalled()
      expect(result.oauthOutcome).toBe('signup-disabled')
      expect(result.profileIncomplete).toBe(false)
      expect(result).not.toHaveProperty('accessToken')
      expect(result).not.toHaveProperty('refreshToken')
      expect(result).not.toHaveProperty('user')
    })

    it('signs in an existing linked account with the signup-existing outcome', async () => {
      mockAuthRepository.findOAuthAccount.mockResolvedValue({
        userId: mockUser.id,
      })
      mockAuthRepository.findUserById.mockResolvedValue(mockUser)
      arrangeSigningIn()

      const result = await useCase.execute(input('signup'))

      expect(mockAuthRepository.createUserFromOAuth).not.toHaveBeenCalled()
      expect(mockAuthRepository.createSession).toHaveBeenCalled()
      expect(result.oauthOutcome).toBe('signup-existing')
    })

    it('links and signs in an account matched by email with the signup-existing outcome', async () => {
      mockAuthRepository.findOAuthAccount.mockResolvedValue(null)
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser)
      mockAuthRepository.linkOAuthAccount.mockResolvedValue({})
      arrangeSigningIn()

      const result = await useCase.execute(input('signup'))

      expect(mockAuthRepository.linkOAuthAccount).toHaveBeenCalledWith(
        mockUser.id,
        'google',
        'google-1',
        'a@example.com',
      )
      expect(mockAuthRepository.createUserFromOAuth).not.toHaveBeenCalled()
      expect(result.oauthOutcome).toBe('signup-existing')
    })
  })

  it('still throws when an existing account is inactive', async () => {
    mockAuthRepository.findOAuthAccount.mockResolvedValue({
      userId: mockUser.id,
    })
    mockAuthRepository.findUserById.mockResolvedValue({
      ...mockUser,
      isActive: false,
    })

    await expect(useCase.execute(input('signup'))).rejects.toThrow(
      UnauthorizedException,
    )
    expect(mockAuthRepository.createSession).not.toHaveBeenCalled()
  })
})
