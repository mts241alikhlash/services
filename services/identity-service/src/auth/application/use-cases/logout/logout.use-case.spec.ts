import { Test, TestingModule } from '@nestjs/testing'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { LogoutUseCase } from './logout.use-case.js'

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase

  const mockAuthRepository = {
    findSessionWithUser: jest.fn(),
    revokeSessionFamily: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        { provide: IAuthRepository, useValue: mockAuthRepository },
      ],
    }).compile()

    useCase = module.get<LogoutUseCase>(LogoutUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('revokes the central session and every app session from an app', async () => {
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        id: 'app-1',
        parentSessionId: 'central-1',
      })
      mockAuthRepository.revokeSessionFamily.mockResolvedValue({ count: 3 })

      await useCase.execute('app-1')

      expect(mockAuthRepository.revokeSessionFamily).toHaveBeenCalledWith(
        'central-1',
      )
    })

    it('revokes a session without a parent and its children', async () => {
      mockAuthRepository.findSessionWithUser.mockResolvedValue({
        id: 'solo-1',
        parentSessionId: null,
      })
      mockAuthRepository.revokeSessionFamily.mockResolvedValue({ count: 1 })

      await useCase.execute('solo-1')

      expect(mockAuthRepository.revokeSessionFamily).toHaveBeenCalledWith(
        'solo-1',
      )
    })

    it('should propagate repository errors', async () => {
      mockAuthRepository.findSessionWithUser.mockResolvedValue(null)
      mockAuthRepository.revokeSessionFamily.mockRejectedValue(
        new Error('DB error'),
      )
      await expect(useCase.execute('session-uuid-1')).rejects.toThrow(
        'DB error',
      )
    })
  })
})
