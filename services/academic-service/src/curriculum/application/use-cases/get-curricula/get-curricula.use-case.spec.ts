import { Test, TestingModule } from '@nestjs/testing'
import { ICurriculumRepository } from '../../../domain/repositories/curriculum.repository.js'
import type { GetCurriculaInput } from './get-curricula.input.js'
import { GetCurriculaUseCase } from './get-curricula.use-case.js'

describe('GetCurriculaUseCase', () => {
  let useCase: GetCurriculaUseCase

  const mockRepository = {
    findAll: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCurriculaUseCase,
        { provide: ICurriculumRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<GetCurriculaUseCase>(GetCurriculaUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: GetCurriculaInput = { page: 1, limit: 10 }

    it('should return paginated data with meta', async () => {
      const mockCurricula = [
        { id: 'curr-uuid-1', name: 'Kurikulum Merdeka' },
        { id: 'curr-uuid-2', name: 'Kurikulum 2013' },
      ]
      mockRepository.findAll.mockResolvedValue({
        data: mockCurricula,
        total: 2,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(input)

      expect(mockRepository.findAll).toHaveBeenCalledWith(input)
      expect(result).toEqual({
        data: mockCurricula,
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

      const result = await useCase.execute(input)

      expect(result.meta.totalPages).toBe(3)
    })

    it('should return empty data when no curricula exist', async () => {
      mockRepository.findAll.mockResolvedValue({
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

    it('should pass academicYearId filter to repository', async () => {
      const filteredInput: GetCurriculaInput = {
        page: 1,
        limit: 10,
        academicYearId: '550e8400-e29b-41d4-a716-446655440009',
      }
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      await useCase.execute(filteredInput)

      expect(mockRepository.findAll).toHaveBeenCalledWith(filteredInput)
    })

    it('should pass search filter to repository', async () => {
      const filteredInput: GetCurriculaInput = {
        page: 1,
        limit: 10,
        search: 'merdeka',
      }
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      await useCase.execute(filteredInput)

      expect(mockRepository.findAll).toHaveBeenCalledWith(filteredInput)
    })
  })
})
