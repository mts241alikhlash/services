import { Test, TestingModule } from '@nestjs/testing'
import { ICurriculumSubjectRepository } from '../../../domain/repositories/curriculum-subject.repository.js'
import type { GetCurriculumSubjectsInput } from './get-curriculum-subjects.input.js'
import { GetCurriculumSubjectsUseCase } from './get-curriculum-subjects.use-case.js'

describe('GetCurriculumSubjectsUseCase', () => {
  let useCase: GetCurriculumSubjectsUseCase

  const mockRepository = {
    findAll: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCurriculumSubjectsUseCase,
        { provide: ICurriculumSubjectRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<GetCurriculumSubjectsUseCase>(
      GetCurriculumSubjectsUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should return repository result', async () => {
      const input: GetCurriculumSubjectsInput = { page: 1, limit: 10 }
      const expected = { data: [{ id: 'cs-1' }], total: 1, page: 1, limit: 10 }
      mockRepository.findAll.mockResolvedValue(expected)

      const result = await useCase.execute(input)

      expect(mockRepository.findAll).toHaveBeenCalledWith(input)
      expect(result).toEqual(expected)
    })
  })
})
