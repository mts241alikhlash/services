import { Injectable } from '@nestjs/common'
import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'
import { PromotionSemesterResolver } from '../../services/promotion-semester-resolver.service.js'
import type { PreviewPromotionInput } from './preview-promotion.input.js'
import type { PromotionPreviewResult } from './preview-promotion.result.js'

@Injectable()
export class PreviewPromotionUseCase {
  constructor(private readonly semesterResolver: PromotionSemesterResolver) {}

  execute(input: PreviewPromotionInput): PromotionPreviewResult {
    const { sourceAcademicYearId, targetAcademicYearId, students } = input

    this.semesterResolver.assertDifferentYears(
      sourceAcademicYearId,
      targetAcademicYearId,
    )

    let promotedCount = 0
    let repeatedCount = 0
    const actionCounts = new Map<PromotionAction, number>()

    for (const student of students) {
      const current = actionCounts.get(student.action) ?? 0
      actionCounts.set(student.action, current + 1)

      switch (student.action) {
        case PromotionAction.PROMOTE:
          promotedCount++
          break
        case PromotionAction.REPEAT:
          repeatedCount++
          break
      }
    }

    const items = [...actionCounts].map(([action, studentCount]) => ({
      action,
      studentCount,
    }))

    return {
      items,
      totalStudents: students.length,
      promotedCount,
      repeatedCount,
    }
  }
}
