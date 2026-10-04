import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'
import { IPromotionRepository } from '../../../domain/repositories/promotion.repository.js'
import { PromotionSemesterResolver } from '../../services/promotion-semester-resolver.service.js'
import type { PreviewPromotionInput } from './preview-promotion.input.js'
import { PreviewPromotionUseCase } from './preview-promotion.use-case.js'

describe('PreviewPromotionUseCase', () => {
  let useCase: PreviewPromotionUseCase

  const mockRepository = {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreviewPromotionUseCase,
        PromotionSemesterResolver,
        { provide: IPromotionRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<PreviewPromotionUseCase>(PreviewPromotionUseCase)
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: PreviewPromotionInput = {
      sourceAcademicYearId: 'ay-1',
      targetAcademicYearId: 'ay-2',
      students: [
        {
          studentId: 's1',
          sourceClassroomId: 'c1',
          targetClassroomId: 'c2',
          action: PromotionAction.PROMOTE,
        },
        {
          studentId: 's2',
          sourceClassroomId: 'c1',
          targetClassroomId: 'c1',
          action: PromotionAction.REPEAT,
          declineReason: 'Did not meet minimum score',
        },
      ],
    }

    it('should count students per action', () => {
      const result = useCase.execute(input)

      expect(result.totalStudents).toBe(2)
      expect(result.promotedCount).toBe(1)
      expect(result.repeatedCount).toBe(1)
      expect(result.items).toEqual(
        expect.arrayContaining([
          { action: PromotionAction.PROMOTE, studentCount: 1 },
          { action: PromotionAction.REPEAT, studentCount: 1 },
        ]),
      )
    })

    it('should throw BadRequestException when source and target years are the same', () => {
      expect(() =>
        useCase.execute({ ...input, targetAcademicYearId: 'ay-1' }),
      ).toThrow(BadRequestException)
    })
  })
})
