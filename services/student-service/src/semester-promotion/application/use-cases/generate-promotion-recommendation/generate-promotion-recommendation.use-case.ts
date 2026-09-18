import { Injectable } from '@nestjs/common'
import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'
import { IPromotionRepository } from '../../../domain/repositories/promotion.repository.js'
import { isSameSection } from '../../../domain/policies/classroom-section.policy.js'
import { PromotionSemesterResolver } from '../../services/promotion-semester-resolver.service.js'
import type { GenerateRecommendationInput } from './generate-promotion-recommendation.input.js'
import type {
  PromotionRecommendationItemResult,
  PromotionRecommendationResult,
} from './generate-promotion-recommendation.result.js'

@Injectable()
export class GeneratePromotionRecommendationUseCase {
  constructor(
    private readonly promotionRepository: IPromotionRepository,
    private readonly semesterResolver: PromotionSemesterResolver,
  ) {}

  async execute(
    input: GenerateRecommendationInput,
  ): Promise<PromotionRecommendationResult> {
    const { sourceAcademicYearId, targetAcademicYearId } = input

    const sourceSemester = await this.semesterResolver.resolveSource(
      sourceAcademicYearId,
      targetAcademicYearId,
    )

    const [enrollments, targetClassrooms] = await Promise.all([
      this.promotionRepository.findActiveEnrollmentsWithDetails(
        sourceSemester.id,
      ),
      this.promotionRepository.findClassesByAcademicYear(targetAcademicYearId),
    ])

    const levelSet = new Set(targetClassrooms.map((c) => c.grade.level))
    const sortedLevels = [...levelSet].sort((a, b) => a - b)

    const getNextLevel = (currentLevel: number): number | null => {
      const idx = sortedLevels.indexOf(currentLevel)
      if (idx === -1 || idx === sortedLevels.length - 1) return null
      return sortedLevels[idx + 1]
    }

    const maxLevel =
      sortedLevels.length > 0 ? sortedLevels[sortedLevels.length - 1] : null
    const isFinalYear = (level: number) =>
      maxLevel !== null && level >= maxLevel

    const graduating = enrollments.filter((e) =>
      isFinalYear(e.classroom.grade.level),
    )
    const promotable = enrollments.filter(
      (e) => !isFinalYear(e.classroom.grade.level),
    )

    const items: PromotionRecommendationItemResult[] = promotable.map(
      (enrollment) => {
        const sourceLevel = enrollment.classroom.grade.level
        let targetClassroomId: string | undefined
        let targetClassroomName: string | undefined
        let targetLevel: string | undefined

        const nextLevel = getNextLevel(sourceLevel)
        if (nextLevel !== null) {
          const matchingTargets = targetClassrooms.filter(
            (c) => c.grade.level === nextLevel,
          )
          const sectionMatch = matchingTargets.find((c) =>
            isSameSection(enrollment.classroom.code, c.code),
          )
          const codeMatch = matchingTargets.find(
            (c) => c.code === enrollment.classroom.code,
          )
          const bestMatch = sectionMatch ?? codeMatch ?? matchingTargets[0]

          if (bestMatch) {
            targetClassroomId = bestMatch.id
            targetClassroomName = bestMatch.code ?? undefined
            targetLevel = bestMatch.grade.name
          }
        }

        return {
          studentId: enrollment.student.id,
          studentName: enrollment.student.user?.profile?.name ?? '-',
          nis: enrollment.student.nis,
          sourceClassroomId: enrollment.classroom.id,
          sourceClassroomName: enrollment.classroom.code,
          sourceLevel: enrollment.classroom.grade.name,
          recommendedAction: PromotionAction.PROMOTE,
          targetClassroomId,
          targetClassroomName,
          targetLevel,
          averageScore: enrollment.reportCard?.totalAverage ?? null,
        }
      },
    )

    return {
      items,
      totalStudents: items.length,
      excludedGraduatingCount: graduating.length,
    }
  }
}
