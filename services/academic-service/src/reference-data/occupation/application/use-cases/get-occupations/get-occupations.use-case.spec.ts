import { Test, TestingModule } from '@nestjs/testing'
import { IOccupationRepository } from '../../../domain/repositories/occupation.repository.js'
import { GetOccupationsUseCase } from './get-occupations.use-case.js'
import type { ListOccupationsInput } from './get-occupations.input.js'

describe('GetOccupationsUseCase', () => {
  let useCase: GetOccupationsUseCase

  const mockRepo = {
    findAll: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOccupationsUseCase,
        { provide: IOccupationRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<GetOccupationsUseCase>(GetOccupationsUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: ListOccupationsInput = { page: 1, limit: 10 }

    it('should return paginated occupations with correct meta', async () => {
      const mockData = [
        { id: 'occ-1', name: 'Wiraswasta' },
        { id: 'occ-2', name: 'PNS' },
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
        isActive: undefined,
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

    it('should return empty data when no occupations exist', async () => {
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

    it('should forward search and isActive filters to repository', async () => {
      const filteredInput: ListOccupationsInput = {
        page: 1,
        limit: 10,
        search: 'Wira',
        isActive: true,
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
        isActive: filteredInput.isActive,
      })
    })
  })
})
