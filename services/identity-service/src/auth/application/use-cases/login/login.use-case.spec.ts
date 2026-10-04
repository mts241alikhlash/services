import { UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { PasswordManagerService } from '../../services/password-manager.service.js'
import { CredentialsService } from '../../services/credentials.service.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { LoginUseCase } from './login.use-case.js'
import { LoginInput } from './login.input.js'

describe('LoginUseCase', () => {
  let useCase: LoginUseCase

  const mockPasswordManagerService = {
    validatePassword: jest.fn(),
  }

  const mockTokenManagerService = {
    generateTokenPair: jest.fn(),
    hashToken: jest.fn(),
    getRefreshExpirationMs: jest.fn(),
    getAbsoluteSessionMs: jest.fn().mockReturnValue(30 * 86400000),
  }

  const mockAuthRepository = {
    findGrants: jest.fn().mockResolvedValue({ roles: [], permissions: [] }),
    findUserByIdentifier: jest.fn(),
    createSession: jest.fn(),
  }

  const mockUser = {
    id: 'user-uuid-1',
    identifier: 'admin',
    passwordHash: 'hashed-password',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userRoles: [{ role: { code: 'APPLICANT' } }],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        CredentialsService,
        {
          provide: PasswordManagerService,
          useValue: mockPasswordManagerService,
        },
        { provide: TokenManagerService, useValue: mockTokenManagerService },
        { provide: IAuthRepository, useValue: mockAuthRepository },
      ],
    }).compile()

    useCase = module.get<LoginUseCase>(LoginUseCase)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('caps the session at the absolute limit', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue({
        ...mockUser,
        userRoles: [{ role: { code: 'APPLICANT' } }],
      })
      mockPasswordManagerService.validatePassword.mockResolvedValue(true)
      mockTokenManagerService.generateTokenPair.mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
      })
      mockTokenManagerService.hashToken.mockReturnValue('h')
      mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(604800000)
      mockAuthRepository.createSession.mockResolvedValue({})

      await useCase.execute({ identifier: 'admin', password: 'x' })

      const created = mockAuthRepository.createSession.mock.calls[0][0] as {
        expiresAt: Date
        absoluteExpiresAt: Date
      }
      expect(created.absoluteExpiresAt.getTime() - Date.now()).toBeGreaterThan(
        29 * 86400000,
      )
      expect(created.expiresAt <= created.absoluteExpiresAt).toBe(true)
    })

    it('refuses a staff account on the applicant form after checking the password', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue({
        ...mockUser,
        userRoles: [{ role: { code: 'TEACHER' } }],
      })
      mockPasswordManagerService.validatePassword.mockResolvedValue(true)

      await expect(
        useCase.execute({ identifier: 'guru', password: 'x' }),
      ).rejects.toThrow('Staf masuk lewat akun sekolah')
      expect(mockAuthRepository.createSession).not.toHaveBeenCalled()
    })

    it('answers a wrong password for a staff account with Invalid credentials', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue({
        ...mockUser,
        userRoles: [{ role: { code: 'TEACHER' } }],
      })
      mockPasswordManagerService.validatePassword.mockResolvedValue(false)

      await expect(
        useCase.execute({ identifier: 'guru', password: 'x' }),
      ).rejects.toThrow('Invalid credentials')
    })

    const loginInput: LoginInput = {
      identifier: 'admin',
      password: 'password123',
    }

    it('should login successfully and return tokens with user info', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue(mockUser)
      mockPasswordManagerService.validatePassword.mockResolvedValue(true)
      mockTokenManagerService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
      mockTokenManagerService.hashToken.mockReturnValue('hashed-refresh')
      mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(604800000)
      mockAuthRepository.createSession.mockResolvedValue({})

      const result = await useCase.execute(
        loginInput,
        'Mozilla/5.0',
        '127.0.0.1',
      )

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshExpiresInMs: 604800000,
        user: {
          id: mockUser.id,
          identifier: mockUser.identifier,
          isActive: mockUser.isActive,
          roles: ['APPLICANT'],
        },
      })
    })

    it('should create a session with correct data', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue(mockUser)
      mockPasswordManagerService.validatePassword.mockResolvedValue(true)
      mockTokenManagerService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
      mockTokenManagerService.hashToken.mockReturnValue('hashed-refresh')
      mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(604800000)
      mockAuthRepository.createSession.mockResolvedValue({})

      await useCase.execute(loginInput, 'Mozilla/5.0', '127.0.0.1')

      expect(mockAuthRepository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          tokenHash: 'hashed-refresh',
          userAgent: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
        }),
      )
    })

    it('should throw UnauthorizedException when user is not found', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue(null)

      await expect(useCase.execute(loginInput)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(mockPasswordManagerService.validatePassword).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue({
        ...mockUser,
        isActive: false,
      })

      await expect(useCase.execute(loginInput)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException when user is soft-deleted', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      })

      await expect(useCase.execute(loginInput)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue(mockUser)
      mockPasswordManagerService.validatePassword.mockResolvedValue(false)

      await expect(useCase.execute(loginInput)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(mockTokenManagerService.generateTokenPair).not.toHaveBeenCalled()
    })

    it('should work without optional userAgent and ipAddress', async () => {
      mockAuthRepository.findUserByIdentifier.mockResolvedValue(mockUser)
      mockPasswordManagerService.validatePassword.mockResolvedValue(true)
      mockTokenManagerService.generateTokenPair.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
      mockTokenManagerService.hashToken.mockReturnValue('hashed-refresh')
      mockTokenManagerService.getRefreshExpirationMs.mockReturnValue(604800000)
      mockAuthRepository.createSession.mockResolvedValue({})

      const result = await useCase.execute(loginInput)

      expect(result.accessToken).toBeDefined()
      expect(mockAuthRepository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: undefined,
          ipAddress: undefined,
        }),
      )
    })
  })
})
