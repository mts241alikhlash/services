import { Test, TestingModule } from '@nestjs/testing'
import { IParentRepository } from '../../../domain/repositories/parent.repository.js'
import { GetParentsUseCase } from './get-parents.use-case.js'
import type { ListParentsInput } from './get-parents.input.js'

describe('GetParentsUseCase', () => {
  let useCase: GetParentsUseCase

  const mockRepo = {
    findAll: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetParentsUseCase,
        { provide: IParentRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<GetParentsUseCase>(GetParentsUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: ListParentsInput = { page: 1, limit: 10 }

    it('should return paginated parents with correct meta', async () => {
      const mockData = [
        { id: 'par-1', name: 'Budi Santoso' },
        { id: 'par-2', name: 'Siti Rahayu' },
      ]
      mockRepo.findAll.mockResolvedValue({
        data: mockData,
        total: 2,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(input)

      expect(mockRepo.findAll).toHaveBeenCalledWith({
        page: input.page,
        limit: input.limit,
        search: undefined,
        occupationId: undefined,
      })
      expect(result).toEqual({
        data: mockData,
        meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      })
    })

    it('should calculate totalPages correctly', async () => {
      mockRepo.findAll.mockResolvedValue({
        data: [],
        total: 25,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(input)

      expect(result.meta.totalPages).toBe(3)
    })

    it('should return empty data when no parents exist', async () => {
      mockRepo.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(input)

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
      expect(result.meta.totalPages).toBe(0)
    })

    it('should forward search and occupationId filters to repository', async () => {
      const filteredInput: ListParentsInput = {
        page: 1,
        limit: 10,
        search: 'Budi',
        occupationId: '550e8400-e29b-41d4-a716-446655440012',
      }
      mockRepo.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      await useCase.execute(filteredInput)

      expect(mockRepo.findAll).toHaveBeenCalledWith({
        page: filteredInput.page,
        limit: filteredInput.limit,
        search: filteredInput.search,
        occupationId: filteredInput.occupationId,
      })
    })
  })
})
