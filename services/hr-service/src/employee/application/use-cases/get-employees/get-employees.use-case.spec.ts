import { Test, TestingModule } from '@nestjs/testing'
import { GetEmployeesInput } from './get-employees.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { GetEmployeesUseCase } from './get-employees.use-case.js'

describe('GetEmployeesUseCase', () => {
  let useCase: GetEmployeesUseCase

  const mockRepository = {
    findAll: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEmployeesUseCase,
        { provide: IEmployeeRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<GetEmployeesUseCase>(GetEmployeesUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const query: GetEmployeesInput = { page: 1, limit: 10 }

    it('should return paginated employees with correct meta', async () => {
      const mockData = [
        { id: 'emp-1', profile: { name: 'Budi Santoso' } },
        { id: 'emp-2', profile: { name: 'Siti Rahayu' } },
      ]

      mockRepository.findAll.mockResolvedValue({
        data: mockData,
        total: 2,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(query)

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        employmentTypeId: undefined,
        academicYearId: undefined,
        positionCategoryId: undefined,
        isActive: undefined,
      })
      expect(result).toEqual({
        data: mockData,
        meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      })
    })

    it('should calculate totalPages correctly', async () => {
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 25,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(query)

      expect(result.meta.totalPages).toBe(3)
    })

    it('should return empty data when no records exist', async () => {
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(query)

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
      expect(result.meta.totalPages).toBe(0)
    })

    it('should forward search query to repository', async () => {
      const searchQuery: GetEmployeesInput = {
        page: 1,
        limit: 10,
        search: 'Budi',
      }
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      await useCase.execute(searchQuery)

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'Budi',
        employmentTypeId: undefined,
        academicYearId: undefined,
        positionCategoryId: undefined,
        isActive: undefined,
      })
    })
  })
})
