import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ICurriculumSubjectRepository } from '../../../domain/repositories/curriculum-subject.repository.js'
import type { UpdateCurriculumSubjectInput } from './update-curriculum-subject.input.js'
import { UpdateCurriculumSubjectUseCase } from './update-curriculum-subject.use-case.js'

describe('UpdateCurriculumSubjectUseCase', () => {
  let useCase: UpdateCurriculumSubjectUseCase

  const mockRepository = {
    findById: jest.fn(),
    findDuplicate: jest.fn(),
    update: jest.fn(),
  }

  const existing = {
    id: 'cs-1',
    curriculumId: 'cur-1',
    subjectId: 'sub-1',
    hoursPerWeek: 4,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCurriculumSubjectUseCase,
        { provide: ICurriculumSubjectRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<UpdateCurriculumSubjectUseCase>(
      UpdateCurriculumSubjectUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should update when no key fields change', async () => {
      const input: UpdateCurriculumSubjectInput = { hoursPerWeek: 6 }
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.update.mockResolvedValue({ ...existing, hoursPerWeek: 6 })

      const result = await useCase.execute('cs-1', input)

      expect(mockRepository.findDuplicate).not.toHaveBeenCalled()
      expect(mockRepository.update).toHaveBeenCalledWith('cs-1', {
        curriculumId: undefined,
        subjectId: undefined,
        hoursPerWeek: 6,
        passingScore: undefined,
      })
      expect(result.hoursPerWeek).toBe(6)
    })

    it('should check duplicate when key fields change', async () => {
      const input: UpdateCurriculumSubjectInput = { subjectId: 'sub-2' }
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.findDuplicate.mockResolvedValue(null)
      mockRepository.update.mockResolvedValue({ ...existing, ...input })

      await useCase.execute('cs-1', input)

      expect(mockRepository.findDuplicate).toHaveBeenCalled()
    })

    it('should throw ConflictException when duplicate found', async () => {
      const input: UpdateCurriculumSubjectInput = { subjectId: 'sub-2' }
      mockRepository.findById.mockResolvedValue(existing)
      mockRepository.findDuplicate.mockResolvedValue({ id: 'cs-other' })

      await expect(useCase.execute('cs-1', input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute('cs-missing', {})).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
