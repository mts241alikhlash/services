import { Test, TestingModule } from '@nestjs/testing'
import { PromotionAction } from '../../domain/enums/promotion-action.enum.js'
import { GenerateRecommendationDto } from './dto/request/generate-recommendation.dto.js'
import { PromotionDto } from './dto/request/promotion.dto.js'
import { GeneratePromotionRecommendationUseCase } from '../../application/use-cases/generate-promotion-recommendation/generate-promotion-recommendation.use-case.js'
import { PreviewPromotionUseCase } from '../../application/use-cases/preview-promotion/preview-promotion.use-case.js'
import { PromoteStudentsUseCase } from '../../application/use-cases/promote-students/promote-students.use-case.js'
import { SemesterPromotionController } from './semester-promotion.controller.js'

describe('SemesterPromotionController', () => {
  let controller: SemesterPromotionController

  const mockPromoteStudentsService = { execute: jest.fn() }
  const mockPreviewPromotionService = { execute: jest.fn() }
  const mockGenerateRecommendationService = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemesterPromotionController],
      providers: [
        {
          provide: PromoteStudentsUseCase,
          useValue: mockPromoteStudentsService,
        },
        {
          provide: PreviewPromotionUseCase,
          useValue: mockPreviewPromotionService,
        },
        {
          provide: GeneratePromotionRecommendationUseCase,
          useValue: mockGenerateRecommendationService,
        },
      ],
    }).compile()

    controller = module.get<SemesterPromotionController>(
      SemesterPromotionController,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('recommend', () => {
    it('should delegate to GeneratePromotionRecommendationUseCase', async () => {
      const dto: GenerateRecommendationDto = {
        sourceAcademicYearId: 'ay-1',
        targetAcademicYearId: 'ay-2',
      }
      mockGenerateRecommendationService.execute.mockResolvedValue({
        items: [],
        totalStudents: 0,
        excludedGraduatingCount: 0,
      })

      const result = await controller.recommend(dto)

      expect(mockGenerateRecommendationService.execute).toHaveBeenCalledWith({
        sourceAcademicYearId: 'ay-1',
        targetAcademicYearId: 'ay-2',
      })
      expect(result).toEqual({
        items: [],
        totalStudents: 0,
        excludedGraduatingCount: 0,
      })
    })
  })

  describe('previewPromotion', () => {
    it('should delegate to PreviewPromotionUseCase synchronously', () => {
      const dto: PromotionDto = {
        sourceAcademicYearId: 'ay-1',
        targetAcademicYearId: 'ay-2',
        students: [
          {
            studentId: 's1',
            sourceClassroomId: 'c1',
            targetClassroomId: 'c2',
            action: PromotionAction.PROMOTE,
          },
        ],
      }
      mockPreviewPromotionService.execute.mockReturnValue({
        items: [{ action: PromotionAction.PROMOTE, studentCount: 1 }],
        totalStudents: 1,
        promotedCount: 1,
        repeatedCount: 0,
      })

      const result = controller.previewPromotion(dto)

      expect(mockPreviewPromotionService.execute).toHaveBeenCalledWith({
        sourceAcademicYearId: 'ay-1',
        targetAcademicYearId: 'ay-2',
        students: dto.students,
      })
      expect(result.totalStudents).toBe(1)
    })
  })

  describe('promote', () => {
    it('should delegate to PromoteStudentsUseCase', async () => {
      const dto: PromotionDto = {
        sourceAcademicYearId: 'ay-1',
        targetAcademicYearId: 'ay-2',
        students: [
          {
            studentId: 's1',
            sourceClassroomId: 'c1',
            targetClassroomId: 'c2',
            action: PromotionAction.PROMOTE,
          },
        ],
      }
      mockPromoteStudentsService.execute.mockResolvedValue({
        promoted: 1,
        repeated: 0,
        skipped: 0,
      })

      const result = await controller.promote(dto)

      expect(mockPromoteStudentsService.execute).toHaveBeenCalledWith({
        sourceAcademicYearId: 'ay-1',
        targetAcademicYearId: 'ay-2',
        students: dto.students,
      })
      expect(result).toEqual({ promoted: 1, repeated: 0, skipped: 0 })
    })
  })
})
