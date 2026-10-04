import { Test, TestingModule } from '@nestjs/testing'
import { IPromotionRepository } from '../../../domain/repositories/promotion.repository.js'
import { PromotionSemesterResolver } from '../../services/promotion-semester-resolver.service.js'
import type { GenerateRecommendationInput } from './generate-promotion-recommendation.input.js'
import { GeneratePromotionRecommendationUseCase } from './generate-promotion-recommendation.use-case.js'

describe('GeneratePromotionRecommendationUseCase', () => {
  let useCase: GeneratePromotionRecommendationUseCase

  const mockRepository: Record<string, jest.Mock> = {
    findLatestEnrolledSemesterOfAcademicYear: jest.fn(),
    findEdgeSemesterOfAcademicYear: jest.fn(),
    findAcademicYearName: jest.fn(),
    findActiveEnrollmentsWithDetails: jest.fn(),
    findClassesByAcademicYear: jest.fn(),
  }

  const sourceSemester = { id: 'sem-src', academicYearId: 'ay-1' }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneratePromotionRecommendationUseCase,
        PromotionSemesterResolver,
        { provide: IPromotionRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<GeneratePromotionRecommendationUseCase>(
      GeneratePromotionRecommendationUseCase,
    )
    jest.clearAllMocks()
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      sourceSemester,
    )
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: GenerateRecommendationInput = {
      sourceAcademicYearId: 'ay-1',
      targetAcademicYearId: 'ay-2',
    }

    const enrollment = {
      id: 'enr-1',
      studentId: 's1',
      classroomId: 'c1',
      student: { id: 's1', nis: '12345', user: { profile: { name: 'Ani' } } },
      classroom: { id: 'c1', code: 'VII-A', grade: { level: 7, name: 'VII' } },
      reportCard: { totalAverage: 88 },
    }
    const targetClassroomSameSection = {
      id: 'c2',
      code: 'VIII-A',
      grade: { level: 8, name: 'VIII' },
    }

    it('should recommend PROMOTE into the same-section next-level classroom', async () => {
      mockRepository.findActiveEnrollmentsWithDetails.mockResolvedValue([
        enrollment,
      ])
      mockRepository.findClassesByAcademicYear.mockResolvedValue([
        { id: 'c0', code: 'VII-A', grade: { level: 7, name: 'VII' } },
        targetClassroomSameSection,
        { id: 'c3', code: 'VIII-B', grade: { level: 8, name: 'VIII' } },
      ])

      const result = await useCase.execute(input)

      expect(result.totalStudents).toBe(1)
      expect(result.excludedGraduatingCount).toBe(0)
      expect(result.items[0].targetClassroomId).toBe('c2')
      expect(result.items[0].averageScore).toBe(88)
    })

    it('should exclude final-year students from the recommendation list', async () => {
      const finalYearEnrollment = {
        ...enrollment,
        classroom: { id: 'c9', code: 'IX-A', grade: { level: 9, name: 'IX' } },
      }
      mockRepository.findActiveEnrollmentsWithDetails.mockResolvedValue([
        finalYearEnrollment,
      ])
      mockRepository.findClassesByAcademicYear.mockResolvedValue([
        { id: 'c9', code: 'IX-A', grade: { level: 9, name: 'IX' } },
      ])

      const result = await useCase.execute(input)

      expect(result.items).toHaveLength(0)
      expect(result.excludedGraduatingCount).toBe(1)
    })
  })
})
