import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'

export interface PromotionPreviewItemResult {
  action: PromotionAction
  studentCount: number
}

export interface PromotionPreviewResult {
  items: PromotionPreviewItemResult[]
  totalStudents: number
  promotedCount: number
  repeatedCount: number
}
