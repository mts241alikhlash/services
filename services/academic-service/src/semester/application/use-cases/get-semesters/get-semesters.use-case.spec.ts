import { Test, TestingModule } from '@nestjs/testing'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'
import type { ListSemestersInput } from './get-semesters.input.js'
import { GetSemestersUseCase } from './get-semesters.use-case.js'

describe('GetSemestersUseCase', () => {
  let useCase: GetSemestersUseCase

  const mockRepository = { findAll: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSemestersUseCase,
        { provide: ISemesterRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<GetSemestersUseCase>(GetSemestersUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: ListSemestersInput = { page: 1, limit: 10 }

    it('should return paginated semesters', async () => {
      mockRepository.findAll.mockResolvedValue({
        data: [{ id: 'sem-1' }],
        total: 1,
        page: 1,
        limit: 10,
      })

      const result = await useCase.execute(input)

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        academicYearId: undefined,
        isActive: undefined,
      })
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
    })

    it('should pass academicYearId and isActive filters through', async () => {
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      await useCase.execute({
        page: 1,
        limit: 10,
        academicYearId: 'ay-1',
        isActive: true,
      })

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        academicYearId: 'ay-1',
        isActive: true,
      })
    })
  })
})
