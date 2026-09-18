import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'

export interface PreviewPromotionStudentInput {
  studentId: string
  sourceClassroomId: string
  action: PromotionAction
  targetClassroomId?: string
  declineReason?: string
}

export interface PreviewPromotionInput {
  sourceAcademicYearId: string
  targetAcademicYearId: string
  students: PreviewPromotionStudentInput[]
}
