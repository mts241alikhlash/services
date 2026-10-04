import { UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { GetProfileUseCase } from './get-profile.use-case.js'

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase

  const mockAuthRepository = {
    findUserById: jest.fn(),
  }

  const mockUser = {
    id: 'user-uuid-1',
    identifier: 'admin',
    isActive: true,
    profile: { name: 'Admin User' },
    userRoles: [
      {
        role: {
          code: 'ADMIN',
          rolePermissions: [{ permission: { code: 'students.read' } }],
        },
      },
    ],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileUseCase,
        { provide: IAuthRepository, useValue: mockAuthRepository },
      ],
    }).compile()

    useCase = module.get<GetProfileUseCase>(GetProfileUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should return user profile data', async () => {
      mockAuthRepository.findUserById.mockResolvedValue(mockUser)

      const result = await useCase.execute('user-uuid-1')

      expect(result).toEqual({
        id: mockUser.id,
        identifier: mockUser.identifier,
        isActive: mockUser.isActive,
        name: 'Admin User',
        roles: ['ADMIN'],
        permissions: ['students.read'],
      })
    })

    it('unions the permissions of every role held, without duplicates', async () => {
      mockAuthRepository.findUserById.mockResolvedValue({
        ...mockUser,
        userRoles: [
          {
            role: {
              code: 'TEACHER',
              rolePermissions: [
                { permission: { code: 'students.read' } },
                { permission: { code: 'attendances.manage' } },
              ],
            },
          },
          {
            role: {
              code: 'WALI_KELAS',
              rolePermissions: [
                { permission: { code: 'students.read' } },
                { permission: { code: 'report-cards.read' } },
              ],
            },
          },
        ],
      })

      const result = await useCase.execute('user-uuid-1')

      expect(result.roles).toEqual(['TEACHER', 'WALI_KELAS'])
      expect([...result.permissions].sort()).toEqual([
        'attendances.manage',
        'report-cards.read',
        'students.read',
      ])
    })

    it('returns an empty permission set for a user with no roles', async () => {
      mockAuthRepository.findUserById.mockResolvedValue({
        ...mockUser,
        userRoles: [],
      })

      const result = await useCase.execute('user-uuid-1')

      expect(result.roles).toEqual([])
      expect(result.permissions).toEqual([])
    })

    it('should throw UnauthorizedException when user not found', async () => {
      mockAuthRepository.findUserById.mockResolvedValue(null)

      await expect(useCase.execute('nonexistent-id')).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})
