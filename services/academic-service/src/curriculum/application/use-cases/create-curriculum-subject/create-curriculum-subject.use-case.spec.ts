import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ICurriculumSubjectRepository } from '../../../domain/repositories/curriculum-subject.repository.js'
import type { CreateCurriculumSubjectInput } from './create-curriculum-subject.input.js'
import { CreateCurriculumSubjectUseCase } from './create-curriculum-subject.use-case.js'

describe('CreateCurriculumSubjectUseCase', () => {
  let useCase: CreateCurriculumSubjectUseCase

  const mockRepository = {
    findDuplicate: jest.fn(),
    findSoftDeleted: jest.fn(),
    restore: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCurriculumSubjectUseCase,
        { provide: ICurriculumSubjectRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<CreateCurriculumSubjectUseCase>(
      CreateCurriculumSubjectUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateCurriculumSubjectInput = {
      curriculumId: 'cur-1',
      subjectId: 'sub-1',
      hoursPerWeek: 4,
    }

    it('should create successfully', async () => {
      const created = { id: 'cs-1', ...input }
      mockRepository.findDuplicate.mockResolvedValue(null)
      mockRepository.findSoftDeleted.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(created)

      const result = await useCase.execute(input)

      expect(mockRepository.findDuplicate).toHaveBeenCalledWith(
        input.curriculumId,
        input.subjectId,
      )
      expect(mockRepository.create).toHaveBeenCalledWith({
        curriculumId: input.curriculumId,
        subjectId: input.subjectId,
        hoursPerWeek: input.hoursPerWeek,
        passingScore: undefined,
      })
      expect(result).toEqual(created)
    })

    it('should throw ConflictException when duplicate exists', async () => {
      mockRepository.findDuplicate.mockResolvedValue({ id: 'existing' })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should restore soft-deleted record instead of creating new', async () => {
      const softDeleted = { id: 'cs-old' }
      const restored = { id: 'cs-old', ...input }
      mockRepository.findDuplicate.mockResolvedValue(null)
      mockRepository.findSoftDeleted.mockResolvedValue(softDeleted)
      mockRepository.restore.mockResolvedValue(restored)

      const result = await useCase.execute(input)

      expect(mockRepository.restore).toHaveBeenCalledWith('cs-old', {
        hoursPerWeek: input.hoursPerWeek,
        passingScore: undefined,
      })
      expect(mockRepository.create).not.toHaveBeenCalled()
      expect(result).toEqual(restored)
    })
  })
})
