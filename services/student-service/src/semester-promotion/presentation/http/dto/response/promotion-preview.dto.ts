import { ApiProperty } from '@nestjs/swagger'
import { PromotionAction } from '../../../../domain/enums/promotion-action.enum.js'
import { PromotionPreviewResult } from '../../../../application/use-cases/preview-promotion/preview-promotion.result.js'

export class PromotionPreviewItemDto {
  @ApiProperty() action: PromotionAction
  @ApiProperty() studentCount: number
}

export class PromotionPreviewDto {
  @ApiProperty({ type: [PromotionPreviewItemDto] })
  items: PromotionPreviewItemDto[]
  @ApiProperty() totalStudents: number
  @ApiProperty() promotedCount: number
  @ApiProperty() repeatedCount: number

  static fromResult(result: PromotionPreviewResult): PromotionPreviewDto {
    const dto = new PromotionPreviewDto()
    dto.items = result.items
    dto.totalStudents = result.totalStudents
    dto.promotedCount = result.promotedCount
    dto.repeatedCount = result.repeatedCount
    return dto
  }
}
