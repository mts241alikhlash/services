import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { GetEmployeeByIdUseCase } from './get-employee-by-id.use-case.js'

describe('GetEmployeeByIdUseCase', () => {
  let useCase: GetEmployeeByIdUseCase

  const mockRepository = {
    findById: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEmployeeByIdUseCase,
        { provide: IEmployeeRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<GetEmployeeByIdUseCase>(GetEmployeeByIdUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'emp-1'

    it('should return an employee when found', async () => {
      const mockEmployee = {
        id: 'emp-1',
        user: { id: 'u-1', identifier: 'guru001', role: 'EMPLOYEE' },
        profile: { id: 'p-1', name: 'Budi Santoso', nik: '3578010101700001' },
      }
      mockRepository.findById.mockResolvedValue(mockEmployee)

      const result = await useCase.execute(id)

      expect(mockRepository.findById).toHaveBeenCalledWith(id)
      expect(result).toEqual(mockEmployee)
    })

    it('should throw NotFoundException when employee is not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(id)).rejects.toThrow(NotFoundException)
    })
  })
})
