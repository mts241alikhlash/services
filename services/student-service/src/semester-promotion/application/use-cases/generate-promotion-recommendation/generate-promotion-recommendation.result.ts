import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'

export interface PromotionRecommendationItemResult {
  studentId: string
  studentName: string
  nis: string
  sourceClassroomId: string
  sourceClassroomName: string
  sourceLevel: string
  recommendedAction: PromotionAction
  targetClassroomId?: string
  targetClassroomName?: string
  targetLevel?: string
  averageScore: number | null
}

export interface PromotionRecommendationResult {
  items: PromotionRecommendationItemResult[]
  totalStudents: number
  excludedGraduatingCount: number
}
