import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { DeleteEmployeeUseCase } from './delete-employee.use-case.js'

describe('DeleteEmployeeUseCase', () => {
  let useCase: DeleteEmployeeUseCase

  const mockRepository = {
    findById: jest.fn(),
    softDelete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteEmployeeUseCase,
        { provide: IEmployeeRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<DeleteEmployeeUseCase>(DeleteEmployeeUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'emp-1'

    it('should soft-delete an employee successfully', async () => {
      const mockEmployee = { id: 'emp-1', user: { id: 'u-1' } }
      mockRepository.findById.mockResolvedValue(mockEmployee)
      mockRepository.softDelete.mockResolvedValue(undefined)

      await useCase.execute(id)

      expect(mockRepository.findById).toHaveBeenCalledWith(id)
      expect(mockRepository.softDelete).toHaveBeenCalledWith(id, 'u-1')
    })

    it('should throw NotFoundException when employee is not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(id)).rejects.toThrow(NotFoundException)
      expect(mockRepository.softDelete).not.toHaveBeenCalled()
    })
  })
})
