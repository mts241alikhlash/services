import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'

export interface PromoteStudentDecision {
  studentId: string
  sourceClassroomId: string
  action: PromotionAction
  targetClassroomId?: string
  declineReason?: string
}

export interface PromoteStudentsInput {
  sourceAcademicYearId: string
  targetAcademicYearId: string
  students: PromoteStudentDecision[]
}
