import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { ToggleEmployeeActiveUseCase } from './toggle-employee-active.use-case.js'

describe('ToggleEmployeeActiveUseCase', () => {
  let useCase: ToggleEmployeeActiveUseCase

  const mockRepo = {
    findById: jest.fn(),
    toggleUserActive: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToggleEmployeeActiveUseCase,
        { provide: IEmployeeRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<ToggleEmployeeActiveUseCase>(
      ToggleEmployeeActiveUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const mockEmployee = { id: 'e-1', user: { id: 'u-1', isActive: true } }

    it('should deactivate employee user account', async () => {
      mockRepo.findById.mockResolvedValue(mockEmployee)
      mockRepo.toggleUserActive.mockResolvedValue({
        id: 'u-1',
        isActive: false,
      })

      await useCase.execute('e-1', false)

      expect(mockRepo.findById).toHaveBeenCalledWith('e-1')
      expect(mockRepo.toggleUserActive).toHaveBeenCalledWith('u-1', false)
    })

    it('should activate employee user account', async () => {
      const inactiveEmployee = {
        id: 'e-1',
        user: { id: 'u-1', isActive: false },
      }
      mockRepo.findById.mockResolvedValue(inactiveEmployee)
      mockRepo.toggleUserActive.mockResolvedValue({
        id: 'u-1',
        isActive: true,
      })

      await useCase.execute('e-1', true)

      expect(mockRepo.toggleUserActive).toHaveBeenCalledWith('u-1', true)
    })

    it('should throw NotFoundException when employee not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute('missing', false)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.toggleUserActive).not.toHaveBeenCalled()
    })
  })
})
